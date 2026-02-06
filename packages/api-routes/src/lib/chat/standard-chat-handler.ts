import { createLogger } from "@workspace/server/logger.js";
import {
  stepCountIs,
  streamText,
  type Tool,
  type UIMessageStreamWriter,
} from "ai";
import { STANDARD_SYSTEM_PROMPT } from "../../providers/prompts.js";
import { type Bindings } from "../../types/bindings.js";
import { type CustomUIMessage } from "../../types/custom-ui-message.js";
import { createDocument } from "../tools/create-document.js";
import { updateDocument } from "../tools/update-document.js";
import { generateUUID } from "../utils.js";
import { ChatHandler } from "./chat-handler.js";
import { type ChatRequest } from "./chat-request.js";

const logger = createLogger("standard-chat-handler");

export class StandardChatHandler extends ChatHandler {
  private systemPrompt = STANDARD_SYSTEM_PROMPT;

  constructor(env: Bindings, request: ChatRequest) {
    super(env, request);
  }

  private async buildSystemPrompt(): Promise<string> {
    const finalPrompt = await this.buildBaseSystemPrompt(this.systemPrompt);

    logger.info("Final system prompt:\n\n", finalPrompt);

    return finalPrompt;
  }

  protected retrieveToolSet(
    writer: UIMessageStreamWriter<CustomUIMessage>,
  ): Record<string, Tool> {
    const tools: Record<string, Tool> = {
      createDocument: createDocument({
        userId: this.request.user.id,
        dataStream: writer,
      }),
      updateDocument: updateDocument({
        userId: this.request.user.id,
        dataStream: writer,
      }),
    };

    return tools;
  }

  protected async executeChat(
    writer: UIMessageStreamWriter<CustomUIMessage>,
  ): Promise<void> {
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
