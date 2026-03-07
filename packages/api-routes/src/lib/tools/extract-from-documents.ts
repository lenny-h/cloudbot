import * as z from "zod";

import { createLogger } from "@workspace/server/logger/logger.js";
import { generateText, tool, type UIMessageStreamWriter } from "ai";
import { searchModelIdx } from "../../providers/models.js";
import { documentSearchPrompt } from "../../providers/prompts.js";
import { getModel } from "../../providers/providers.js";
import { type Bindings } from "../../types/bindings.js";
import { type CustomUIMessage } from "../../types/custom-ui-message.js";
import { buildMetadataFilter } from "../../utils/build-metadata-filter.js";
import { type FileMetadata } from "../../utils/filter-authorized-files.js";
import { FolderMetadata } from "../../utils/filter-authorized-folders.js";

type ExtractFromDocumentsProps = {
  env: Bindings;
  userId: string;
  fileMetadata: FileMetadata[];
  folderMetadata: FolderMetadata[];
  dataStream: UIMessageStreamWriter<CustomUIMessage>;
};

export type DocumentSource = {
  folderId: string;
  filename: string;
  score: number;
};

const logger = createLogger("extract-from-documents");

export const extractFromDocuments = ({
  env,
  userId,
  fileMetadata,
  folderMetadata,
}: ExtractFromDocumentsProps) =>
  tool({
    description:
      "Extracts information from the user's document knowledge base by having an LLM read the documents and extract relevant information. You can make a search more extensive by increasing the max_num_results parameter.",
    inputSchema: z.object({
      query: z.string(),
      max_num_results: z.number().min(2).max(8).default(4),
    }),
    outputSchema: z.object({
      extractedInformation: z.string(),
      sources: z.array(
        z.object({
          folderId: z.string(),
          filename: z.string(),
          score: z.number(),
        }),
      ),
    }),
    execute: async ({ query, max_num_results }) => {
      try {
        // Permissions already checked in standard-chat-handler
        // fileMetadata contains only files the user has access to

        logger.debug("Building metadata filter for document search", {
          userId,
          fileMetadata,
          folderMetadata,
        });

        const metadataFilter = buildMetadataFilter(
          userId,
          fileMetadata,
          folderMetadata,
        );

        logger.debug(
          "Metadata filter for document search",
          JSON.stringify(metadataFilter, null, 2),
        );

        const searchResult = await env.AI.autorag(
          process.env.AUTORAG_NAME ?? "",
        ).search({
          query,
          max_num_results,
          ranking_options: {
            score_threshold: 0.2,
          },
          reranking: {
            enabled: true,
            model: "@cf/baai/bge-reranker-base",
          },
          ...(metadataFilter ? { filters: metadataFilter } : {}),
        });

        const sources = searchResult.data.map((item) => {
          const parts = item.filename.split("/");
          return {
            folderId: parts[parts.length - 2] ?? "",
            filename: parts[parts.length - 1] ?? item.filename,
            score: item.score,
          };
        });

        logger.info(`Found ${sources.length} source(s) for query: "${query}"`);

        const context = searchResult.data
          .map((item, i) => {
            const { folderId, filename } = sources[i];
            return `[${folderId}/${filename}]\n${item.content}`;
          })
          .join("\n\n");

        const config = await getModel(env, searchModelIdx);
        const result = await generateText({
          model: config.model,
          system: documentSearchPrompt,
          prompt: `Query: ${query}\n\nSources:\n${context}`,
        });

        return { extractedInformation: result.text, sources };
      } catch (error) {
        logger.error("Error in extractFromDocuments tool", error);
        throw error;
      }
    },
  });
