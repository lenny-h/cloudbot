import * as z from "zod";

export const allowedMediaTypes = [
  "image/jpg",
  "image/jpeg",
  "image/png",
  "application/pdf",
] as const;

export const allowedExtensions = new Set(
  allowedMediaTypes.map((type) => {
    return type.split("/").pop();
  }),
);

export const attachmentSchema = z.object({
  filename: z.string().max(256),
  mediaType: z.enum(allowedMediaTypes, {
    message:
      "Only image/jpg, image/jpeg, image/png, and application/pdf are allowed",
  }),
  previewUrl: z.string().optional(),
});

export type Attachment = z.infer<typeof attachmentSchema>;
