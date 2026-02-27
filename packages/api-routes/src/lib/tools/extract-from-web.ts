import * as z from "zod";

import { createLogger } from "@workspace/server/logger/logger.js";
import { generateText, tool, type UIMessageStreamWriter } from "ai";
import { webSearchModelIdx } from "../../providers/models.js";
import { webSearchPrompt } from "../../providers/prompts.js";
import { getModel } from "../../providers/providers.js";
import { type Bindings } from "../../types/bindings.js";
import { type CustomUIMessage } from "../../types/custom-ui-message.js";
import { type UserLocation } from "../../types/user-location.js";

type ExtractFromWebProps = {
  env: Bindings;
  userLocation: UserLocation;
  dataStream: UIMessageStreamWriter<CustomUIMessage>;
};

type SearchProvider =
  | "vercel-ai-perplexity"
  | "vercel-ai-parallel"
  | "anthropic"
  | "azure"
  | "google"
  | "google-enterprise"
  | "openai"
  | "exalabs"
  | "parallel"
  | "tavily";

const logger = createLogger("extract-from-web");

export const extractFromWeb = ({
  env,
  userLocation,
  dataStream,
}: ExtractFromWebProps) =>
  tool({
    description:
      "Searches the web for current information. Use this tool when you need to find up-to-date information, news, or facts that may not be in your training data.",
    inputSchema: z.object({
      informationToExtract: z
        .string()
        .describe("The information to extract from the web"),
    }),
    outputSchema: z.object({
      extractedInformation: z.string(),
    }),
    execute: async ({ informationToExtract }) => {
      try {
        const provider = process.env.SEARCH_PROVIDER as SearchProvider;

        let tools;

        switch (provider) {
          case "vercel-ai-perplexity": {
            const { gateway } = await import("ai");

            tools = {
              perplexity_search: gateway.tools.perplexitySearch({
                maxResults: 8,
                maxTokens: 50000,
                maxTokensPerPage: 2048,
                country: userLocation.country,
              }),
            };

            break;
          }

          case "vercel-ai-parallel": {
            const { gateway } = await import("ai");

            tools = {
              parallel_search: gateway.tools.parallelSearch({
                mode: "one-shot",
                maxResults: 8,
              }),
            };

            break;
          }

          case "anthropic": {
            const { anthropic } = await import("@ai-sdk/anthropic");

            tools = {
              webFetch: anthropic.tools.webFetch_20250910(),
              webSearch: anthropic.tools.webSearch_20250305({
                userLocation: {
                  type: "approximate",
                  country: userLocation.country,
                  region: userLocation.region,
                  city: userLocation.city,
                  timezone: userLocation.timezone,
                },
              }),
            };

            break;
          }

          case "azure": {
            const { azure } = await import("@ai-sdk/azure");

            tools = {
              web_search_preview: azure.tools.webSearchPreview({
                searchContextSize: "medium",
                userLocation: {
                  type: "approximate",
                  city: userLocation.city,
                  region: userLocation.region,
                },
              }),
            };

            break;
          }

          case "google": {
            const { vertex } = await import("@ai-sdk/google-vertex/edge");

            tools = {
              google_search: vertex.tools.googleSearch({}),
            };

            break;
          }

          case "google-enterprise": {
            const { vertex } = await import("@ai-sdk/google-vertex/edge");

            tools = {
              enterprise_web_search: vertex.tools.enterpriseWebSearch({}),
            };

            break;
          }

          case "openai": {
            const { openai } = await import("@ai-sdk/openai");

            tools = {
              web_search: openai.tools.webSearch({
                searchContextSize: "medium",
                userLocation: {
                  type: "approximate",
                  city: userLocation.city,
                  region: userLocation.region,
                },
              }),
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
          tools: tools as any,
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

        return { extractedInformation: result.text };
      } catch (error) {
        logger.error("Error in extractFromWeb tool", error);
        throw error;
      }
    },
  });
