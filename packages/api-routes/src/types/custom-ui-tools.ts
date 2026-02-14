import { ArtifactKind } from "../schemas/artifact-schema.js";

export type CustomUITools = {
  extractFromWeb: {
    input: { informationToExtract: string };
    output: { extractedInformation: string };
  };
  extractFromDocuments: {
    input: { query: string; max_num_results?: number };
    output: { extractedInformation: string };
  };
  createDocument: {
    input: { title: string; kind: ArtifactKind; description: string };
    output: { id: string; title: string; kind: ArtifactKind; message: string };
  };
  updateDocument: {
    input: { id: string; description: string };
    output: { id: string; title: string; kind: ArtifactKind; message: string };
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
