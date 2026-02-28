import * as z from "zod";
import { artifactSchema } from "./artifact-schema.js";
import { uuidSchema } from "./uuid-schema.js";

export const dataSchemas = {
  chatCreated: z
    .object({
      chatId: uuidSchema,
    })
    .strict(),
  documentIdentifier: z.object({
    id: uuidSchema,
    title: z.string(),
    kind: artifactSchema,
  }),
  textDelta: z.string(),
  codeDelta: z.string(),
  // sheetDelta: z.string(), // Maybe add sheet later
  createFinish: artifactSchema,
  updateFinish: z.object({
    diffId: uuidSchema,
  }),
  fileGenerating: z.string(),
  fileGenerated: z.string(),
};
