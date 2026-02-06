import * as z from "zod";
import { artifactSchema } from "./artifact-schema.js";
import { uuidSchema } from "./uuid-schema.js";

export const dataSchemas = {
  "chat-created": z
    .object({
      id: uuidSchema,
    })
    .strict(),
  id: uuidSchema,
  title: z.string(),
  kind: artifactSchema,
  textDelta: z.string(),
  codeDelta: z.string(),
  sheetDelta: z.string(),
  clear: z.null(),
  finish: z.null(),
};
