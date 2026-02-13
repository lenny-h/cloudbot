import { type Bindings } from "@workspace/api-routes/types/bindings.js";
import { type Variables } from "@workspace/api-routes/types/variables.js";
import { decryptApiKey } from "@workspace/api-routes/utils/encryption.js";
import { db } from "@workspace/server/drizzle/db.js";
import { courseUsers, folders } from "@workspace/server/drizzle/schema.js";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { requestAccessSchema } from "./schema.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>().post(
  "/",
  validator("json", async (value, c) => {
    const parsed = requestAccessSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }
    return parsed.data;
  }),
  async (c) => {
    const { folderId, key } = c.req.valid("json");
    const user = c.get("user");

    // Get folder details
    const result = await db()
      .select({
        visibility: folders.visibility,
        encryptedKey: folders.encryptedKey,
        owner: folders.owner,
      })
      .from(folders)
      .where(eq(folders.id, folderId))
      .limit(1);

    const folder = result[0];
    if (!folder) {
      throw new HTTPException(404, { message: "NOT_FOUND" });
    }

    // Only protected folders require key-based access
    if (folder.visibility !== "protected") {
      throw new HTTPException(400, { message: "INVALID_COURSE_VISIBILITY" });
    }

    // Owners always have access
    if (folder.owner === user.id) {
      return c.json({ message: "Access granted" });
    }

    // Check if user already has access
    const existingAccess = await db()
      .select()
      .from(courseUsers)
      .where(
        and(
          eq(courseUsers.folderId, folderId),
          eq(courseUsers.userId, user.id),
        ),
      )
      .limit(1);

    if (existingAccess.length > 0) {
      return c.json({ message: "Access already granted" });
    }

    // Validate the key
    if (!folder.encryptedKey) {
      throw new HTTPException(500, { message: "INTERNAL_SERVER_ERROR" });
    }

    try {
      const decryptedKey = await decryptApiKey(
        folder.encryptedKey,
        process.env.ENCRYPTION_KEY!,
      );

      if (decryptedKey !== key) {
        throw new HTTPException(403, { message: "INVALID_KEY" });
      }
    } catch (error) {
      throw new HTTPException(403, { message: "INVALID_KEY" });
    }

    // Grant access
    await db().insert(courseUsers).values({
      folderId,
      userId: user.id,
    });

    return c.json({ message: "Access granted" });
  },
);

export default app;
