import { createLogger } from "@workspace/server/logger.js";
import {
  stepCountIs,
  streamText,
  type Tool,
  type UIMessageStreamWriter,
} from "ai";
import { standardSystemPrompt } from "../../providers/prompts.js";
import { type Bindings } from "../../types/bindings.js";
import { type CustomUIMessage } from "../../types/custom-ui-message.js";
import { generateUUID } from "../../utils/generate-uuid.js";
import { getPromptsByIds } from "../queries/prompts.js";
import { createDocument } from "../tools/create-document.js";
import { extractFromDocuments } from "../tools/extract-from-documents.js";
import { extractFromWeb } from "../tools/extract-from-web.js";
import { updateDocument } from "../tools/update-document.js";
import { ChatHandler } from "./chat-handler.js";
import { type ChatRequest } from "./chat-request.js";

const logger = createLogger("standard-chat-handler");

export class StandardChatHandler extends ChatHandler {
  private systemPrompt = standardSystemPrompt;

  constructor(env: Bindings, request: ChatRequest) {
    super(env, request);
  }

  private async buildSystemPrompt(): Promise<string> {
    let finalPrompt = await this.buildBaseSystemPrompt(this.systemPrompt);

    // Append context filter prompts to the system prompt
    const contextFilter = this.getContextFilter();
    if (contextFilter && contextFilter.prompts.length > 0) {
      const promptIds = contextFilter.prompts.map((p) => p.id);
      const userPrompts = await getPromptsByIds({
        ids: promptIds,
        userId: this.request.user.id,
      });

      if (userPrompts.length > 0) {
        finalPrompt += `\n\n## User-Selected Instructions\n\n`;
        finalPrompt += `The user has selected the following custom instructions. Follow them carefully:\n\n`;
        for (const prompt of userPrompts) {
          finalPrompt += `### ${prompt.name}\n\n${prompt.content}\n\n`;
        }
      }
    }

    logger.info("Final system prompt:\n\n", finalPrompt);

    return finalPrompt;
  }

  protected retrieveToolSet(
    writer: UIMessageStreamWriter<CustomUIMessage>,
  ): Record<string, Tool> {
    const tools: Record<string, Tool> = {
      createDocument: createDocument({
        env: this.env,
        userId: this.request.user.id,
        dataStream: writer,
      }),
      updateDocument: updateDocument({
        env: this.env,
        userId: this.request.user.id,
        dataStream: writer,
      }),
      extractFromDocuments: extractFromDocuments({
        env: this.env,
        dataStream: writer,
      }),
    };

    if (this.request.webSearchEnabled) {
      tools.extractFromWeb = extractFromWeb({
        env: this.env,
        userLocation: this.request.userLocation,
        dataStream: writer,
      });
    }

    return tools;
  }

  protected async executeChat(
    writer: UIMessageStreamWriter<CustomUIMessage>,
  ): Promise<void> {
    // Integrate attachments and context filter documents into the messages
    await this.integrateContextIntoMessages();

    const systemPrompt = await this.buildSystemPrompt();
    const streamConfig = await this.buildStreamTextConfig({
      systemPrompt,
    });
    const tools = this.retrieveToolSet(writer);

    logger.info("Executing chat with tools:", Object.keys(tools));

    const result = streamText({
      ...streamConfig,
      tools,
      stopWhen: stepCountIs(6),
    });

    result.consumeStream(); // Consume the stream even if the client disconnects to avoid having unfinished responses

    writer.merge(
      result.toUIMessageStream({
        generateMessageId: generateUUID,
        onFinish: async ({ responseMessage }) => {
          await this.saveResponseMessages([responseMessage]);
        },
        messageMetadata: ({ part }) => {
          // Send total usage when generation is finished
          if (part.type === "finish") {
            return { totalUsage: part.totalUsage };
          }
        },
        sendReasoning: true,
      }),
    );
  }

  protected handleError(error: any): string {
    logger.error("Error in chat route", error);

    return "An error occurred. Please try again later.";
  }
}
