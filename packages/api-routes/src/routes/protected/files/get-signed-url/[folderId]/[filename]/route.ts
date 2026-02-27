import * as z from "zod";

import { StorageClient } from "@workspace/api-routes/lib/storage-client.js";
import { createFilenameWithExtensionSchema } from "@workspace/api-routes/schemas/filename-schema.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { type Bindings } from "@workspace/api-routes/types/bindings.js";
import { type Variables } from "@workspace/api-routes/types/variables.js";
import { db } from "@workspace/server/drizzle/db.js";
import { folderUsers, folders } from "@workspace/server/drizzle/schema.js";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { allowedMediaTypes } from "../schema.js";

const allowedExtensions = new Set(
  allowedMediaTypes.map((type) => type.split("/").pop()),
);

const paramSchema = z
  .object({
    folderId: uuidSchema,
    filename: createFilenameWithExtensionSchema(allowedExtensions),
  })
  .strict();

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>().get(
  "/",
  validator("param", (value, c) => {
    const parsed = paramSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }
    return parsed.data;
  }),
  async (c) => {
    const { folderId, filename } = c.req.valid("param");
    const user = c.get("user");

    // Fetch the folder to check permissions
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
      // Public folders allow anyone to download
      hasAccess = true;
    } else if (folder.visibility === "protected") {
      // Protected folders require user to be in folderUsers or be the owner
      const access = await db()
        .select()
        .from(folderUsers)
        .where(
          and(
            eq(folderUsers.folderId, folderId),
            eq(folderUsers.userId, user.id),
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

    // Construct the key using the file owner's ID
    const key =
      folder.visibility === "private"
        ? `${user.id}/${folderId}/${filename}`
        : `${folder.visibility}/${folderId}/${filename}`;

    const signedUrl = await StorageClient.getSignedUrlForDownload({
      bucket: process.env.R2_BUCKET_NAME!,
      key,
    });

    return c.json({
      signedUrl,
    });
  },
);

export default app;
