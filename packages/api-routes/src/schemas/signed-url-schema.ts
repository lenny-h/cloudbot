import * as z from "zod";
import { createFilenameWithExtensionSchema } from "./filename-schema.js";

export const createSignedUrlSchema = (allowedMediaTypes: readonly string[]) => {
  const allowedExtensions = new Set(
    allowedMediaTypes.map((type) => {
      return type.split("/").pop();
    }),
  );

  return z
    .object({
      filename: createFilenameWithExtensionSchema(allowedExtensions),
      fileSize: z
        .number()
        .int()
        .positive()
        .max(30 * 1024 * 1024, {
          message: "File size must be less than 30 MB",
        }),
      fileType: z.enum(allowedMediaTypes, {
        message: "Invalid file type",
      }),
    })
    .strict();
};
