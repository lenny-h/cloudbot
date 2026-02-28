import * as z from "zod";

import { tool } from "ai";
import { artifactSchema } from "../../schemas/artifact-schema.js";
import { createDocument } from "./create-document.js";
import { extractFromDocuments } from "./extract-from-documents.js";
import { extractFromWeb } from "./extract-from-web.js";
import { generateFile } from "./generate-file.js";
import { updateDocument } from "./update-document.js";

export const tools = {
  extractFromWeb: extractFromWeb,
  extractFromDocuments: extractFromDocuments,
  createDocument: createDocument,
  updateDocument: updateDocument,
  generateFile: generateFile,
};

export const mockedTools = {
  extractFromWeb: tool({
    inputSchema: z.object({
      informationToExtract: z.string(),
    }),
    outputSchema: z.object({
      extractedInformation: z.string(),
    }),
  }),
  extractFromDocuments: tool({
    inputSchema: z.object({
      query: z.string(),
      max_num_results: z.number().optional(),
    }),
    outputSchema: z.object({
      extractedInformation: z.string(),
    }),
  }),
  createDocument: tool({
    inputSchema: z.object({
      title: z.string(),
      kind: artifactSchema,
      description: z.string(),
    }),
    outputSchema: z.object({
      id: z.string(),
      title: z.string(),
      kind: artifactSchema,
      message: z.string(),
    }),
  }),
  updateDocument: tool({
    inputSchema: z.object({
      id: z.string(),
      description: z.string(),
    }),
    outputSchema: z.object({
      id: z.string(),
      diffId: z.string(),
      title: z.string(),
      kind: artifactSchema,
      message: z.string(),
    }),
  }),
  generateFile: tool({
    inputSchema: z.object({
      title: z.string(),
      format: z.string(),
      description: z.string(),
    }),
    outputSchema: z.object({
      fileId: z.string(),
      filename: z.string(),
      format: z.string(),
      contentType: z.string(),
      size: z.number(),
      message: z.string(),
    }),
  }),
};
