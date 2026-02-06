import { type Chat } from "@workspace/server/drizzle/schema/schema.js";
import { createLogger } from "@workspace/server/logger.js";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  smoothStream,
  streamText,
  type Tool,
  type UIMessageStreamWriter,
} from "ai";
import { generateTitleFromUserMessage } from "../../providers/generate-title.js";
import { titleModelIdx } from "../../providers/models.js";
import { getModel } from "../../providers/providers.js";
import { type Bindings } from "../../types/bindings.js";
import { type CustomUIMessage } from "../../types/custom-ui-message.js";
import { saveChat } from "../queries/chats.js";
import { saveMessages } from "../queries/messages.js";
import { type ChatRequest } from "./chat-request.js";

const logger = createLogger("chat-handler");

type StreamTextInput = Parameters<typeof streamText>[0];

export abstract class ChatHandler {
  protected env: Bindings;
  protected request: ChatRequest;

  constructor(env: Bindings, request: ChatRequest) {
    this.env = env;
    this.request = request;
  }

  protected async generateChatTitle(): Promise<string> {
    const config = await getModel(this.env, titleModelIdx);

    logger.debug("Generating chat title with model", {
      chatId: this.request.id,
      message: this.request.lastMessage,
      model: config.model.toString(),
    });

    return await generateTitleFromUserMessage({
      message: this.request.lastMessage,
      model: config.model,
    });
  }

  protected async handleChatCreation(): Promise<Chat | undefined> {
    if (!this.request.createNewChat) return undefined;

    logger.debug("Creating new chat", { chatId: this.request.id });

    const title = await this.generateChatTitle();
    const createdChat = await saveChat({
      id: this.request.id,
      userId: this.request.user.id,
      title,
    });
    await this.saveUserMessage();

    return createdChat;
  }

  protected async saveUserMessage(): Promise<void> {
    logger.debug("Saving user message", { chatId: this.request.id });

    await saveMessages({
      chatId: this.request.id,
      newMessages: [this.request.lastMessage],
    });
  }

  protected async saveResponseMessages(
    messages: CustomUIMessage[],
  ): Promise<void> {
    if (this.request.isTemporary) return;

    logger.debug("Saving response messages", {
      chatId: this.request.id,
      messages,
    });

    await saveMessages({
      chatId: this.request.id,
      newMessages: messages,
    });
  }

  protected async buildBaseSystemPrompt(
    initialSystemPrompt: string,
  ): Promise<string> {
    let finalPrompt = initialSystemPrompt;

    // Add current date and time information
    const currentDate = new Date();
    const dateString = currentDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const timeString = currentDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });

    finalPrompt += `\n\n## Current Context\n\n`;
    finalPrompt += `Today's date is ${dateString} at ${timeString}.\n`;

    // Add user location context from Cloudflare edge data
    const { city, region, country, timezone } = this.request.userLocation;
    if (timezone) {
      finalPrompt += `The user is in the timezone: ${timezone}.\n`;
    }
    if (city && region && country) {
      finalPrompt += `The user is located in ${city}, ${region}, ${country}.\n`;
    }

    return finalPrompt;
  }

  protected async buildStreamTextConfig({
    systemPrompt,
  }: {
    systemPrompt: string;
  }): Promise<StreamTextInput> {
    const config = await getModel(this.env, this.request.modelIdx);
    let modelMessages = await convertToModelMessages(this.request.messages);

    return {
      system: systemPrompt,
      model: config.model,
      providerOptions: config.providerOptions,
      messages: modelMessages,
      experimental_transform: smoothStream({
        chunking: "word",
      }),
    };
  }

  async handleRequest(): Promise<Response> {
    const createdChat = await this.handleChatCreation();

    const stream = createUIMessageStream<CustomUIMessage>({
      execute: async ({ writer }) => {
        if (createdChat) {
          writer.write({
            type: "data-chat-created",
            data: { id: createdChat.id },
            transient: true,
          });
        }

        await this.executeChat(writer);
      },
      onError: (error) => this.handleError(error),
    });

    return createUIMessageStreamResponse({ stream });
  }

  // Abstract methods to be implemented by subclasses
  protected abstract retrieveToolSet(
    writer: UIMessageStreamWriter<CustomUIMessage>,
  ): Record<string, Tool>;
  protected abstract executeChat(
    writer: UIMessageStreamWriter<CustomUIMessage>,
  ): Promise<void>;
  protected abstract handleError(error: any): string;
}
