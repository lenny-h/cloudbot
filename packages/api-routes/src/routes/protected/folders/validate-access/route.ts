import { type Bindings } from "@workspace/api-routes/types/bindings.js";
import { type Variables } from "@workspace/api-routes/types/variables.js";
import { db } from "@workspace/server/drizzle/db.js";
import {
  courseUsers,
  folders,
} from "@workspace/server/drizzle/schema/schema.js";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { validateAccessSchema } from "./schema.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>().post(
  "/",
  validator("json", async (value, c) => {
    const parsed = validateAccessSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }
    return parsed.data;
  }),
  async (c) => {
    const { folderId } = c.req.valid("json");
    const user = c.get("user");

    // Check if folder exists and get its visibility
    const result = await db
      .select({
        visibility: folders.visibility,
        owner: folders.owner,
      })
      .from(folders)
      .where(eq(folders.id, folderId))
      .limit(1);

    const folder = result[0];
    if (!folder) {
      throw new HTTPException(404, { message: "NOT_FOUND" });
    }

    // Public folders are always accessible
    if (folder.visibility === "public") {
      return c.json({ hasAccess: true });
    }

    // Owner always has access
    if (folder.owner === user.id) {
      return c.json({ hasAccess: true });
    }

    // For protected folders, check courseUsers table
    if (folder.visibility === "protected") {
      const access = await db
        .select()
        .from(courseUsers)
        .where(
          and(
            eq(courseUsers.folderId, folderId),
            eq(courseUsers.userId, user.id),
          ),
        )
        .limit(1);

      return c.json({ hasAccess: access.length > 0 });
    }

    // Private folders - only owner has access
    return c.json({ hasAccess: false });
  },
);

export default app;
