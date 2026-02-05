import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import {
  extractReasoningMiddleware,
  wrapLanguageModel,
  type JSONValue,
  type LanguageModel,
} from "ai";
import { HTTPException } from "hono/http-exception";
import { chatModels } from "./models.js";

export interface Config {
  model: LanguageModel;
  providerOptions: { [model: string]: Record<string, JSONValue> };
}

export const getModel = async (
  selectedChatModel: number,
  reasoningEnabled?: boolean,
): Promise<Config> => {
  const chatModel = chatModels[selectedChatModel];

  if (!chatModel) {
    throw new HTTPException(400, { message: "INVALID_MODEL" });
  }

  if (chatModel.provider === "amazon-bedrock") {
    const { createAmazonBedrock } = await import("@ai-sdk/amazon-bedrock");

    const bedrock = createAmazonBedrock({
      region: process.env.AWS_REGION,
      credentialProvider: fromNodeProviderChain(),
    });

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

  if (chatModel.provider === "google-vertex") {
    const { vertex } = await import("@ai-sdk/google-vertex");

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

  if (chatModel.provider === "openai") {
    const { openai } = await import("@ai-sdk/openai");

    return {
      model: openai(chatModel.name),
      providerOptions: {
        openai: {
          parallelToolCalls: false,
          store: false,
          ...(reasoningEnabled
            ? { reasoningEffort: "medium", reasoningSummary: "auto" }
            : {
                reasoningEffort: "none",
              }),
        },
      },
    };
  }
};
