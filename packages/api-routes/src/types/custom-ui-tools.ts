export type CustomUITools = {
  extractFromWeb: {
    input: { informationToExtract: string };
    output: { response: string };
  };
  extractFromDocuments: {
    input: { query: string; max_num_results?: number };
    output: { extractedInformation: string };
  };
  createDocument: {
    input: { title: string; content: string };
    output: { documentId: string };
  };
  updateDocument: {
    input: { documentId: string; content: string };
    output: { success: boolean };
  };
  generateFile: {
    input: { fileName: string; content: string };
    output: { fileUrl: string };
  };
};
