import {
  extractReasoningMiddleware,
  wrapLanguageModel,
  type JSONValue,
  type LanguageModel,
} from "ai";
import { HTTPException } from "hono/http-exception";
import { Bindings } from "../types/bindings.js";
import { chatModels } from "./models.js";

export interface Config {
  model: LanguageModel;
  providerOptions: { [model: string]: Record<string, JSONValue> };
}

export const getModel = async (
  env: Bindings,
  modelIdx: number,
  reasoningEnabled?: boolean,
): Promise<Config> => {
  const chatModel = chatModels[modelIdx];

  if (!chatModel) {
    throw new HTTPException(400, { message: "INVALID_MODEL" });
  }

  switch (chatModel.provider) {
    case "vercel-ai-gateway": {
      const { gateway } = await import("ai");

      return {
        model: gateway(chatModel.name),
        providerOptions: {
          gateway: {
            zeroDataRetention: true,
          },
        },
      };
    }

    case "workers-ai": {
      const { createWorkersAI } = await import("workers-ai-provider");

      const workersai = createWorkersAI({ binding: env.AI });

      return {
        model: workersai(chatModel.name),
        providerOptions: {},
      };
    }

    case "anthropic": {
      const { anthropic } = await import("@ai-sdk/anthropic");

      return {
        model: anthropic(chatModel.name),
        providerOptions: {
          anthropic: {
            ...(reasoningEnabled
              ? {
                  contextManagement: {
                    edits: [
                      {
                        type: "clear_thinking_20251015",
                        keep: { type: "thinking_turns", value: 2 },
                      },
                    ],
                  },
                  disableParallelToolUse: true,
                  sendReasoning: true,
                  thinking: { type: "enabled", budgetTokens: 1024 },
                }
              : {}),
          },
        },
      };
    }

    case "amazon-bedrock": {
      const { bedrock } = await import("@ai-sdk/amazon-bedrock");

      const bedrockModel = bedrock(chatModel.name);

      return {
        model: wrapLanguageModel({
          model: bedrockModel,
          middleware: extractReasoningMiddleware({ tagName: "thinking" }),
        }),
        providerOptions: {
          amazon_bedrock: {
            ...(reasoningEnabled
              ? { reasoningConfig: { type: "enabled", budgetTokens: 1024 } }
              : {}),
          },
        },
      };
    }

    case "azure": {
      const { azure } = await import("@ai-sdk/azure");

      const azureModel = azure(chatModel.name);

      return {
        model: wrapLanguageModel({
          model: azureModel,
          middleware: extractReasoningMiddleware({ tagName: "think" }),
        }),
        providerOptions: {
          openai: {
            parallelToolCalls: false,
            ...(reasoningEnabled
              ? { reasoningEffort: "medium", reasoningSummary: "auto" }
              : {
                  reasoningEffort: "minimal",
                }),
            store: false,
          },
        },
      };
    }

    case "google-vertex": {
      const { vertex } = await import("@ai-sdk/google-vertex/edge");

      return {
        model: vertex(chatModel.name),
        providerOptions: {
          google: {
            ...(reasoningEnabled
              ? {
                  thinkingConfig: {
                    includeThoughts: true,
                    thinkingBudget: 1024,
                  },
                }
              : {}),
          },
        },
      };
    }

    case "openai": {
      const { openai } = await import("@ai-sdk/openai");

      return {
        model: openai(chatModel.name),
        providerOptions: {
          openai: {
            parallelToolCalls: false,
            ...(reasoningEnabled
              ? { reasoningEffort: "medium", reasoningSummary: "auto" }
              : {
                  reasoningEffort: "minimal",
                }),
            store: false,
          },
        },
      };
    }

    default:
      throw new HTTPException(400, { message: "INVALID_MODEL" });
  }
};
