import { type Bindings } from "@workspace/api-routes/types/bindings.js";
import { type Variables } from "@workspace/api-routes/types/variables.js";
import { encryptApiKey } from "@workspace/api-routes/utils/encryption.js";
import { generateUUID } from "@workspace/api-routes/utils/generate-uuid.js";
import { db } from "@workspace/server/drizzle/db.js";
import {
  courseUsers,
  folders,
} from "@workspace/server/drizzle/schema/schema.js";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { createCourseSchema } from "./schema.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>().post(
  "/",
  validator("json", async (value, c) => {
    const parsed = createCourseSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }
    return parsed.data;
  }),
  async (c) => {
    const { values } = c.req.valid("json");
    const user = c.get("user");

    // Encrypt password if provided
    const encryptedKey =
      values.visibility === "protected" && values.password
        ? await encryptApiKey(values.password, process.env.ENCRYPTION_KEY!)
        : undefined;

    await db.transaction(async (tx) => {
      const folderId = await db.insert(folders).values({
        id: generateUUID(),
        name: values.name,
        owner: user.id,
        description: values.description,
        visibility: values.visibility,
        encryptedKey,
      });

      // If the folder is protected, add the creator as a member
      if (values.visibility === "protected") {
        await tx.insert(courseUsers).values({
          folderId,
          userId: user.id,
        });
      }
    });

    return c.json({ message: "Folder created" });
  },
);

export default app;
