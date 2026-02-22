import * as z from "zod";

import { deleteFolder } from "@workspace/api-routes/lib/queries/folders.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { type Bindings } from "@workspace/api-routes/types/bindings.js";
import { type Variables } from "@workspace/api-routes/types/variables.js";
import { db } from "@workspace/server/drizzle/db.js";
import { files, folders } from "@workspace/server/drizzle/schema.js";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const paramSchema = z.object({ folderId: uuidSchema }).strict();

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>().delete(
  "/",
  validator("param", (value, c) => {
    const parsed = paramSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }
    return parsed.data;
  }),
  async (c) => {
    const { folderId } = c.req.valid("param");
    const user = c.get("user");

    const result = await db()
      .select({
        visibility: folders.visibility,
      })
      .from(folders)
      .where(and(eq(folders.id, folderId), eq(folders.owner, user.id)))
      .limit(1);

    const folder = result[0];
    if (!folder) {
      throw new HTTPException(404, { message: "NOT_FOUND" });
    }

    const folderFiles = await db()
      .select({
        id: files.id,
        visibility: files.visibility,
      })
      .from(files)
      .where(eq(files.folderId, folderId));

    if (folderFiles.length === 0) {
      const deletedFolderName = await deleteFolder({ folderId });

      if (!deletedFolderName) {
        throw new HTTPException(404, { message: "NOT_FOUND" });
      }

      return c.json({ name: deletedFolderName });
    }

    for (const file of folderFiles) {
      await db().delete(files).where(eq(files.id, file.id));

      const key =
        file.visibility === "private"
          ? `${user.id}/${folderId}/${file.id}`
          : `${file.visibility}/${folderId}/${file.id}`;

      await c.env.CLOUDBOT_BUCKET.delete(key);
    }

    const deletedFolderName = await deleteFolder({ folderId });

    if (!deletedFolderName) {
      throw new HTTPException(404, { message: "NOT_FOUND" });
    }

    return c.json({ name: deletedFolderName });
  },
);

export default app;
