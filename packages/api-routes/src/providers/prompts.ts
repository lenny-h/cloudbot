export const standardSystemPrompt: string = `Give concise and helpful responses. If you use web or document sources, cite each source inline. For document sources, use: [[doc:folderId/filename]]. For web sources, use: [[web:{url}]]. When citing multiple sources, separate each citation with a space (e.g., [[doc:folder1/file1]] [[web:https://example.com]]). Only cite the same source multiple times if you cite another source in between. It is also good practice to reference equations: You can do this by simply enclosing the equation number in square brackets, e.g. [2.51]. Also, follow these instructions:
  
  - For math equations, use LaTeX syntax (prefer block equations over inline equations).
  - For programming languages, specify the language at the beginning of the block, e.g. \`\`\`python\ncode here\`\`\`.
  `;

export const completionSystemPrompt: string =
  "You are an autocomplete assistant. Predict the next 5-20 words based on context. Output the last three characters of the context followed by your prediction.";

export const wordCompletionCheckPrompt: string =
  "Check if the last word is complete or incomplete (cut off mid-word).";

export const documentSearchPrompt: string =
  "Answer the query using only the provided sources. Cite each used source inline as [[doc:folderId/filename]] immediately after the claim it supports. Separate multiple citations with a space. Be concise.";

export const webSearchPrompt: string =
  "Your purpose is to extract relevant information from the web. Cite each source by referencing its URL using the format [[web:{url}]]. When citing multiple sources, separate each citation with a space (e.g., [[web:https://example.com]] [[web:https://other.com]]).";

export function createDocumentPrompt(kind: "text" | "code" | "sheet"): string {
  const prompts = {
    text: "Write a document based on the provided title and description. The title is the topic and the description contains additional instructions or context. Markdown is supported. Use headings wherever appropriate.",
    code: "Generate clean, production-ready code based on the provided title and description. The title names the task and the description contains additional requirements or context. Use best practices, meaningful names, proper error handling, and include helpful comments. Output ONLY the code without explanations.",
    sheet:
      "Generate well-structured CSV data based on the provided title and description. The title names the dataset and the description contains additional requirements or context. Include realistic values and proper formatting. Include 10-50 rows unless specified. Output ONLY the CSV data.",
  };

  return prompts[kind];
}

export function updateDocumentPrompt(
  currentContent: string,
  kind: "text" | "code" | "sheet",
): string {
  const kindInstructions = {
    text: `Update the document preserving tone, style, and structure. Make requested changes while maintaining coherence and readability.`,
    code: `Update the code preserving style, functionality, and architecture. Make only requested changes while maintaining consistency.`,
    sheet: `Update the CSV preserving structure, headers, and data types. Maintain consistency and proper formatting.`,
  };

  return `${kindInstructions[kind]}

CURRENT CONTENT:
${currentContent}

Apply the requested changes. Output ONLY the updated content without explanations.`;
}
