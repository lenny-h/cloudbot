import { StorageClient } from "@workspace/api-routes/lib/storage-client.js";
import { createSignedUrlSchema } from "@workspace/api-routes/schemas/signed-url-schema.js";
import { type Bindings } from "@workspace/api-routes/types/bindings.js";
import { type Variables } from "@workspace/api-routes/types/variables.js";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { allowedMediaTypes } from "./schema.js";

const signedUrlSchema = createSignedUrlSchema(allowedMediaTypes);

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>().post(
  "/",
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
    const { filename, fileSize, fileType } = c.req.valid("json");
    const user = c.get("user");

    const key = `attachments/${user.id}/${filename}`;

    console.log("Generating signed URL with key:", key, "fileType:", fileType);

    const { url: signedUrl } = await StorageClient.getSignedUrlForUpload({
      bucket: process.env.R2_BUCKET_NAME!,
      key,
      contentType: fileType,
      contentLength: fileSize,
    });

    return c.json({
      signedUrl,
      key,
    });
  },
);

export default app;
