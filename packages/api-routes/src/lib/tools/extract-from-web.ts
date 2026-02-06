import * as z from "zod";

import { generateText, tool, type UIMessageStreamWriter } from "ai";
import { webSearchModelIdx } from "../../providers/models.js";
import { webSearchPrompt } from "../../providers/prompts.js";
import { getModel } from "../../providers/providers.js";
import { type Bindings } from "../../types/bindings.js";
import { type CustomUIMessage } from "../../types/custom-ui-message.js";

type ExtractFromWebProps = {
  env: Bindings;
  dataStream: UIMessageStreamWriter<CustomUIMessage>;
};

type SearchProvider =
  | "anthropic"
  | "google"
  | "openai"
  | "perplexity"
  | "exalabs"
  | "parallel"
  | "tavily";

export const extractFromWeb = ({ env, dataStream }: ExtractFromWebProps) =>
  tool({
    description:
      "Searches the web for current information. Use this tool when you need to find up-to-date information, news, or facts that may not be in your training data.",
    inputSchema: z.object({
      informationToExtract: z
        .string()
        .describe("The information to extract from the web"),
    }),
    outputSchema: z.object({
      response: z.string(),
    }),
    execute: async ({ informationToExtract }) => {
      const provider = process.env.SEARCH_PROVIDER as SearchProvider;

      let tools;

      switch (provider) {
        case "anthropic":
          const { anthropic } = await import("@ai-sdk/anthropic");

          tools = {
            webFetch: anthropic.tools.webFetch_20250910(),
            webSearch: anthropic.tools.webSearch_20250305(),
          };

        case "google": {
          const { vertex } = await import("@ai-sdk/google-vertex");

          tools = {
            google_search: vertex.tools.googleSearch({}),
          };

          break;
        }

        case "openai": {
          const { openai } = await import("@ai-sdk/openai");

          tools = {
            web_search: openai.tools.webSearch({}),
          };

          break;
        }

        case "exalabs": {
          const { webSearch: exaWebSearch } = await import("@exalabs/ai-sdk");

          tools = {
            webSearch: exaWebSearch(),
          };

          break;
        }

        case "parallel": {
          const { searchTool, extractTool } =
            await import("@parallel-web/ai-sdk-tools");

          tools = {
            webSearch: searchTool,
            webExtract: extractTool,
          };

          break;
        }

        case "tavily": {
          const { tavilySearch, tavilyExtract } =
            await import("@tavily/ai-sdk");

          tools = {
            webSearch: tavilySearch(),
            webExtract: tavilyExtract(),
          };

          break;
        }
      }

      const config = await getModel(env, webSearchModelIdx);
      const result = await generateText({
        system: webSearchPrompt,
        prompt:
          "Extract the following information from the web: " +
          informationToExtract,
        model: config.model,
        tools,
      });

      const sources =
        result.sources
          ?.filter((s) => s.sourceType === "url")
          .map((s) => ({
            id: s.id,
            url: s.url,
            title: s.title,
          })) ?? [];

      // Write sources to the data stream
      for (const source of sources) {
        dataStream.write({
          sourceId: source.id,
          type: "source-url",
          url: source.url,
          title: source.title,
        });
      }

      return { response: result.text };
    },
  });
