import * as z from "zod";

import { attachmentSchema } from "./attachment-schema.js";
import { contextFilterSchema } from "./context-filter-schema.js";

const usageSchema = z.object({
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
  totalTokens: z.number().optional(),
});

export const metadataSchema = z
  .object({
    attachments: z.array(attachmentSchema).max(5).optional(),
    contextFilter: contextFilterSchema.optional(),
    totalUsage: usageSchema.optional(),
  })
  .nullable();
