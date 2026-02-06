import { createDocument } from "./create-document.js";
import { extractFromDocuments } from "./extract-from-documents.js";
import { extractFromWeb } from "./extract-from-web.js";
import { updateDocument } from "./update-document.js";

export const tools = {
  extractFromWeb: extractFromWeb,
  extractFromDocuments: extractFromDocuments,
  createDocument: createDocument,
  updateDocument: updateDocument,
};
