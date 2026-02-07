import * as z from "zod";
import { uuidSchema } from "./uuid-schema.js";

export const contextFilterSchema = z
  .object({
    prompts: z
      .array(
        z.object({
          id: uuidSchema,
        }),
      )
      .max(5, {
        message: "You can only select up to 5 prompts",
      }),
    folders: z
      .array(
        z.object({
          id: uuidSchema,
        }),
      )
      .max(5, {
        message: "You can only select up to 5 folders",
      }),
    files: z
      .array(
        z.object({
          id: uuidSchema,
        }),
      )
      .max(5, {
        message: "You can only select up to 5 files",
      }),
    documents: z
      .array(
        z.object({
          id: uuidSchema,
        }),
      )
      .max(5, {
        message: "You can only select up to 5 documents",
      }),
  })
  .strict();

export type ContextFilter = z.infer<typeof contextFilterSchema>;
