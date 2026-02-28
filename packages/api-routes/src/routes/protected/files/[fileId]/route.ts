import * as z from "zod";

import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { type Bindings } from "@workspace/api-routes/types/bindings.js";
import { type Variables } from "@workspace/api-routes/types/variables.js";
import { db } from "@workspace/server/drizzle/db.js";
import { files } from "@workspace/server/drizzle/schema.js";
import { createLogger } from "@workspace/server/logger/logger.js";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const logger = createLogger("delete-file");

const paramSchema = z.object({ fileId: uuidSchema }).strict();

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
    const { fileId } = c.req.valid("param");
    const user = c.get("user");

    const result = await db()
      .delete(files)
      .where(and(eq(files.id, fileId), eq(files.owner, user.id)))
      .returning({
        visibility: files.visibility,
        folderId: files.folderId,
        name: files.name,
      })
      .limit(1);

    const file = result[0];
    if (!file) {
      throw new HTTPException(404, { message: "NOT_FOUND" });
    }

    try {
      const key =
        file.visibility === "private"
          ? `${user.id}/${file.folderId}/${file.name}`
          : `${file.visibility}/${file.folderId}/${file.name}`;

      logger.debug("Deleting file from R2 with key:", { key });

      await c.env.CLOUDBOT_BUCKET.delete(
        `${process.env.R2_BUCKET_NAME}/${key}`,
      );
    } catch (e) {
      // We don't want to fail the whole request if the R2 delete fails, since the database record has already been deleted and we don't want orphaned records. We'll just log the error and move on.
      logger.error("Failed to delete file from R2:", {
        error: e,
        filename: file.name,
      });
    }

    return c.json({ name: file.name });
  },
);

export default app;
