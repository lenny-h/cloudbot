import * as z from "zod";

import { allowedMediaTypes } from "../routes/protected/attachments/get-signed-url/schema.js";

export const attachmentSchema = z.object({
  filename: z.string().max(256),
  mediaType: z.enum(allowedMediaTypes, {
    message:
      "Only image/jpg, image/jpeg, image/png, and application/pdf are allowed",
  }),
  previewUrl: z.string().optional(),
});

export type Attachment = z.infer<typeof attachmentSchema>;
