import * as z from "zod";

import { StorageClient } from "@workspace/api-routes/lib/storage-client.js";
import { formatExtensions } from "@workspace/api-routes/lib/tools/generate-file.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { type Bindings } from "@workspace/api-routes/types/bindings.js";
import { type Variables } from "@workspace/api-routes/types/variables.js";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const paramSchema = z
  .object({
    fileId: uuidSchema,
    extension: z.enum(Object.values(formatExtensions) as [string, ...string[]]),
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
    const { fileId, extension } = c.req.valid("param");
    const user = c.get("user");

    const key = `artifacts/${user.id}/${fileId}.${extension}`;

    const signedUrl = await StorageClient.getSignedUrlForDownload({
      bucket: "cloudbot-bucket",
      key,
    });

    return c.json({
      signedUrl,
    });
  },
);

export default app;
