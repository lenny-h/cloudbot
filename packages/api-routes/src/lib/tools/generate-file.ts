import * as z from "zod";

import { createLogger } from "@workspace/server/logger/logger.js";
import { generateText, tool, type UIMessageStreamWriter } from "ai";
import { artifactModelIdx } from "../../providers/models.js";
import { getModel } from "../../providers/providers.js";
import { type Bindings } from "../../types/bindings.js";
import { type CustomUIMessage } from "../../types/custom-ui-message.js";
import { generateUUID } from "../../utils/generate-uuid.js";

const fileFormats = [
  "html",
  "xml",
  "markdown",
  "latex",
  "json",
  "csv",
  "svg",
] as const;

type FileFormat = (typeof fileFormats)[number];

const formatDescriptions: Record<FileFormat, string> = {
  html: "Formatted HTML document (can include CSS styling)",
  xml: "Structured XML data",
  markdown: "Markdown document",
  latex: "LaTeX document for typesetting",
  json: "Structured JSON data",
  csv: "Comma-separated values spreadsheet",
  svg: "Scalable Vector Graphics image",
};

export const formatExtensions: Record<FileFormat, string> = {
  html: "html",
  xml: "xml",
  markdown: "md",
  latex: "tex",
  json: "json",
  csv: "csv",
  svg: "svg",
};

export const formatContentTypes: Record<FileFormat, string> = {
  html: "text/html",
  xml: "application/xml",
  markdown: "text/markdown",
  latex: "application/x-latex",
  json: "application/json",
  csv: "text/csv",
  svg: "image/svg+xml",
};

function buildSystemPrompt(format: FileFormat): string {
  const base = `You are a document generation assistant. Generate the requested content in ${format.toUpperCase()} format.
Output ONLY the raw ${format.toUpperCase()} content — no explanations, no markdown fences, no wrapper text.`;

  switch (format) {
    case "html":
      return `${base}
      Output a complete HTML document with <!DOCTYPE html>, <html>, <head> (including <meta charset="UTF-8"> and a <style> block for clean styling), and <body>.
      Make the document visually polished and professional.`;

    case "xml":
      return `${base}
      Output well-formed XML with a proper XML declaration. Use descriptive element names.`;

    case "markdown":
      return `${base}
      Use proper markdown syntax with headings, lists, emphasis, and tables where appropriate.`;

    case "latex":
      return `${base}
      Output a complete LaTeX document starting with \\documentclass and including \\begin{document} ... \\end{document}.`;

    case "json":
      return `${base}
      Output valid, well-formatted JSON. Use meaningful keys and proper data types.`;

    case "csv":
      return `${base}
      Use commas as delimiters. Include a header row. Properly escape values containing commas or quotes.`;

    case "svg":
      return `${base}
      Output a valid SVG document with an <svg> root element including xmlns, width, and height attributes.
      Create clean, well-structured vector graphics.`;
  }
}

type GenerateFileProps = {
  userId: string;
  dataStream: UIMessageStreamWriter<CustomUIMessage>;
  env: Bindings;
};

const logger = createLogger("generate-file");

export const generateFile = ({ userId, dataStream, env }: GenerateFileProps) =>
  tool({
    description:
      `Generate a downloadable file in a specified format. Supported formats: ${fileFormats.join(", ")}. ` +
      `Use this tool when the user asks for a downloadable file, export, report, spreadsheet, data file, or formatted document. ` +
      `Format details: ${Object.entries(formatDescriptions)
        .map(([k, v]) => `${k} (${v})`)
        .join("; ")}.`,
    inputSchema: z.object({
      title: z.string().describe("The title of the file to generate."),
      format: z.enum(fileFormats).describe("The output file format"),
      description: z
        .string()
        .describe(
          "A detailed description of the content to generate. Be specific about structure, data, columns, sections, styling preferences, etc.",
        ),
    }),
    outputSchema: z.object({
      fileId: z.string(),
      filename: z.string(),
      format: z.string(),
      contentType: z.string(),
      size: z.number(),
      message: z.string(),
    }),
    execute: async ({ title, format, description }) => {
      try {
        const fileId = generateUUID();
        const extension = formatExtensions[format];
        const contentType = formatContentTypes[format];
        const r2Key = `artifacts/${userId}/${fileId}.${extension}`;

        // Notify the UI that file generation has started
        dataStream.write({
          type: "data-fileGenerating",
          data: JSON.stringify({ fileId, title, format }),
          transient: true,
        });

        // Generate file content using AI
        const config = await getModel(env, artifactModelIdx);
        const result = await generateText({
          model: config.model,
          system: buildSystemPrompt(format),
          prompt: `Generate a ${format.toUpperCase()} file titled "${title}".\n\nRequirements:\n${description}`,
        });

        const content = result.text;

        // Upload to R2
        const contentBuffer = new TextEncoder().encode(content);

        await env.CLOUDBOT_BUCKET.put(r2Key, contentBuffer, {
          httpMetadata: { contentType },
          customMetadata: {
            title,
            format,
            createdAt: new Date().toISOString(),
          },
        });

        // Notify the UI that the file is ready
        const sanitizedTitle = title.replace(/[^a-zA-Z0-9-_\s]/g, "").trim();
        const filename = `${sanitizedTitle}.${extension}`;

        dataStream.write({
          type: "data-fileGenerated",
          data: JSON.stringify({
            fileId,
            filename,
          }),
          transient: true,
        });

        return {
          fileId,
          filename,
          format,
          contentType,
          size: contentBuffer.byteLength,
          message: `A ${format.toUpperCase()} file "${filename}" has been generated and is available for download.`,
        };
      } catch (error) {
        logger.error("Error in generateFile tool", error);
        throw error;
      }
    },
  });
