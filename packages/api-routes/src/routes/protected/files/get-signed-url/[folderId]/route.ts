import * as z from "zod";

import { StorageClient } from "@workspace/api-routes/lib/storage-client.js";
import { createSignedUrlSchema } from "@workspace/api-routes/schemas/signed-url-schema.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { type Bindings } from "@workspace/api-routes/types/bindings.js";
import { type Variables } from "@workspace/api-routes/types/variables.js";
import { generateUUID } from "@workspace/api-routes/utils/generate-uuid.js";
import { db } from "@workspace/server/drizzle/db.js";
import {
  courseUsers,
  files,
  folders,
} from "@workspace/server/drizzle/schema.js";
import { createLogger } from "@workspace/server/logger/logger.js";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { allowedMediaTypes } from "./schema.js";

const logger = createLogger("get-signed-url");

const paramSchema = z.object({ folderId: uuidSchema }).strict();
const signedUrlSchema = createSignedUrlSchema(allowedMediaTypes);

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>().post(
  "/",
  validator("param", (value) => {
    const parsed = paramSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }
    return parsed.data;
  }),
  validator("json", async (value, c) => {
    const parsed = signedUrlSchema.safeParse(value);
    if (!parsed.success) {
      // Check if the error is related to the filename field
      const filenameError = parsed.error.issues.find((issue) =>
        issue.path.includes("filename"),
      );
      if (filenameError) {
        throw new HTTPException(400, { message: "INVALID_FILENAME" });
      }
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }
    return parsed.data;
  }),
  async (c) => {
    const { folderId } = c.req.valid("param");
    const { filename, fileSize, fileType } = c.req.valid("json");
    const user = c.get("user");

    // Fetch the folder to check permissions and get visibility
    const folder = await db()
      .select()
      .from(folders)
      .where(eq(folders.id, folderId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!folder) {
      throw new HTTPException(404, { message: "NOT_FOUND" });
    }

    // Check permissions based on folder visibility
    let hasAccess = false;

    if (folder.visibility === "public") {
      // Public folders allow anyone to upload
      hasAccess = true;
    } else if (folder.visibility === "protected") {
      // Protected folders require user to be in courseUsers or be the owner
      const access = await db()
        .select()
        .from(courseUsers)
        .where(
          and(
            eq(courseUsers.folderId, folderId),
            eq(courseUsers.userId, user.id),
          ),
        )
        .limit(1);

      hasAccess = access.length > 0;
    } else if (folder.visibility === "private") {
      // Private folders require user to be the owner
      hasAccess = folder.owner === user.id;
    }

    if (!hasAccess) {
      throw new HTTPException(403, { message: "FORBIDDEN" });
    }

    // Create file entry with folder's visibility
    const fileId = generateUUID();
    await db().insert(files).values({
      id: fileId,
      folderId,
      name: filename,
      owner: user.id,
      size: fileSize,
      format: fileType,
      visibility: folder.visibility,
    });

    try {
      // Generate signed URL for upload
      const key = `${user.id}/${folderId}/${fileId}`;
      const { url: signedUrl } = await StorageClient.getSignedUrlForUpload({
        bucket: "cloudbot-bucket",
        key,
        contentType: fileType,
        contentLength: fileSize,
      });

      logger.debug("SignedUrl generated:", { signedUrl, key });

      return c.json({
        signedUrl,
        key,
      });
    } catch (error) {
      // Rollback: delete the file entry if signed URL generation fails
      await db().delete(files).where(eq(files.id, fileId));
      logger.error("Failed to generate signed URL, file entry rolled back:", {
        error,
        fileId,
      });
      throw new HTTPException(500, {
        message: "INTERNAL_SERVER_ERROR",
      });
    }
  },
);

export default app;
