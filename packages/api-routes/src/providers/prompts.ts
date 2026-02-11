export const standardSystemPrompt: string = `Give concise and helpful responses. If you use web or document sources, cite each source by referencing its ID. For document sources, use: [[doc:{sourceId}]]. For web sources, use: [[web:{sourceId}]]. When citing multiple sources, separate each citation with a space (e.g., [[doc:id1]] [[doc:id2]]). Only cite the same source multiple times if you cite another source in between. It is also good practice to reference equations: You can do this by simply enclosing the equation number in square brackets, e.g. [2.51]. Also, follow these instructions:
  
  - For math equations, use LaTeX syntax (prefer block equations over inline equations).
  - For programming languages, specify the language at the beginning of the block, e.g. \`\`\`python\ncode here\`\`\`.
  `;

export const completionSystemPrompt: string =
  "You are an autocomplete assistant. Predict the next 5-20 words based on context. Output the last three characters of the context followed by your prediction.";

export const wordCompletionCheckPrompt: string =
  "Check if the last word is complete or incomplete (cut off mid-word).";

export const documentSearchPrompt: string =
  "Your purpose is to extract relevant information from documents. Cite each source by referencing its ID using the format [[doc:{sourceId}]]. When citing multiple sources, separate each citation with a space (e.g., [[doc:id1]] [[doc:id2]]).";

export const webSearchPrompt: string =
  "Your purpose is to extract relevant information from the web. Cite each source by referencing its ID using the format [[web:{sourceId}]]. When citing multiple sources, separate each citation with a space (e.g., [[web:id1]] [[web:id2]]).";

export const codePrompt =
  "Generate clean, production-ready code. Use best practices, meaningful names, proper error handling, and include helpful comments. Output ONLY the code without explanations.";

export const sheetPrompt = `Generate well-structured CSV data with headers, realistic values, and proper formatting. Include 10-50 rows unless specified. Output ONLY the CSV data.`;

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
