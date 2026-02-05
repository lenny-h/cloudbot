import * as z from "zod";

export const attachmentSchema = z.object({
  filename: z.string().max(256),
  mediaType: z.string().max(256),
  previewUrl: z.string().optional(),
});

export type Attachment = z.infer<typeof attachmentSchema>;
