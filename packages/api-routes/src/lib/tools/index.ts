import * as z from "zod";

import { tool } from "ai";
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
      response: z.string(),
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
      content: z.string(),
    }),
    outputSchema: z.object({
      documentId: z.string(),
    }),
  }),
  updateDocument: tool({
    inputSchema: z.object({
      documentId: z.string(),
      content: z.string(),
    }),
    outputSchema: z.object({
      success: z.boolean(),
    }),
  }),
  generateFile: tool({
    inputSchema: z.object({
      fileName: z.string(),
      content: z.string(),
    }),
    outputSchema: z.object({
      fileUrl: z.string(),
    }),
  }),
};
