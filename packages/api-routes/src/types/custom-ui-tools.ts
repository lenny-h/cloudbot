import { type DocumentSource } from "../lib/tools/extract-from-documents.js";
import { type WebSource } from "../lib/tools/extract-from-web.js";
import { type ArtifactKind } from "../schemas/artifact-schema.js";

export type CustomUITools = {
  extractFromWeb: {
    input: { informationToExtract: string };
    output: { extractedInformation: string; sources: WebSource[] };
  };
  extractFromDocuments: {
    input: { query: string; max_num_results?: number };
    output: { extractedInformation: string; sources: DocumentSource[] };
  };
  createDocument: {
    input: { title: string; kind: ArtifactKind; description: string };
    output: { id: string; title: string; kind: ArtifactKind; message: string };
  };
  updateDocument: {
    input: { id: string; description: string };
    output: {
      id: string;
      diffId: string;
      title: string;
      kind: ArtifactKind;
      message: string;
    };
  };
  generateFile: {
    input: { title: string; format: string; description: string };
    output: {
      fileId: string;
      filename: string;
      format: string;
      contentType: string;
      size: number;
      message: string;
    };
  };
};
