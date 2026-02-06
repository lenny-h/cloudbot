import * as z from "zod";

import { tool, type UIMessageStreamWriter } from "ai";
import { documentSearchPrompt } from "../../providers/prompts.js";
import { type Bindings } from "../../types/bindings.js";
import { type CustomUIMessage } from "../../types/custom-ui-message.js";

type ExtractFromDocumentsProps = {
  env: Bindings;
  dataStream: UIMessageStreamWriter<CustomUIMessage>;
};

export const extractFromDocuments = ({
  env,
  dataStream,
}: ExtractFromDocumentsProps) =>
  tool({
    description:
      "Extracts information from the user's document knowledge base by having an LLM read the documents and extract relevant information. You can make a search more extensive by increasing the max_num_results parameter.",
    inputSchema: z.object({
      query: z.string(),
      max_num_results: z.number().min(2).max(8).default(4),
    }),
    outputSchema: z.object({ extractedInformation: z.string() }),
    execute: async ({ query, max_num_results }) => {
      const answer = await env.AI.autorag("autorag").aiSearch({
        system_prompt: documentSearchPrompt,
        query,
        rewrite_query: false,
        max_num_results,
        ranking_options: {
          score_threshold: 0.3,
        },
        reranking: {
          enabled: true,
          model: "@cf/baai/bge-reranker-base",
        },
        stream: false,
      });

      for (const source of answer.data) {
        dataStream.write({
          type: "source-document",
          sourceId: source.file_id,
          mediaType: source.filename.split(".").pop() || "unknown",
          title: source.filename,
        });

        return { extractedInformation: answer.response };
      }
    },
  });
