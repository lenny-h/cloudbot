import { type Chat } from "@workspace/server/drizzle/schema/schema.js";
import { createLogger } from "@workspace/server/logger/logger.js";
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
import { type Attachment } from "../../schemas/attachment-schema.js";
import { type ContextFilter } from "../../schemas/context-filter-schema.js";
import { type Bindings } from "../../types/bindings.js";
import { type CustomUIMessage } from "../../types/custom-ui-message.js";
import { saveChat } from "../queries/chats.js";
import { getLatestDocumentsByIds } from "../queries/documents.js";
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

  protected getContextFilter(): ContextFilter | undefined {
    const metadata = this.request.lastMessage.metadata;
    return metadata?.contextFilter;
  }

  protected getAttachments(): Attachment[] {
    const metadata = this.request.lastMessage.metadata;
    return metadata?.attachments ?? [];
  }

  /**
   * Download attachments from R2 and add them as file parts to the last user message.
   * Also retrieves context filter documents and adds them as text parts.
   */
  protected async integrateContextIntoMessages(): Promise<void> {
    const lastMessage = this.request.lastMessage;
    if (lastMessage.role !== "user") return;

    const attachments = this.getAttachments();
    const contextFilter = this.getContextFilter();

    // Process file attachments from R2
    if (attachments.length > 0) {
      for (const attachment of attachments) {
        try {
          const file = await this.env.YOUR_BUCKET.get(attachment.filename);

          if (!file) {
            logger.warn("Attachment not found in R2", {
              filename: attachment.filename,
            });
            continue;
          }

          const fileContent = await file.arrayBuffer();
          const base64Data = Buffer.from(fileContent).toString("base64");
          const dataUrl = `data:${attachment.mediaType};base64,${base64Data}`;

          lastMessage.parts.push({
            type: "file",
            url: dataUrl,
            mediaType: attachment.mediaType,
          } as any);

          logger.debug("Attached file to message", {
            filename: attachment.filename,
            mediaType: attachment.mediaType,
          });
        } catch (error) {
          logger.warn("Failed to download attachment", {
            filename: attachment.filename,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    // Process context filter documents
    if (contextFilter && contextFilter.documents.length > 0) {
      const documentIds = contextFilter.documents.map((d) => d.id);
      const docs = await getLatestDocumentsByIds({
        ids: documentIds,
        userId: this.request.user.id,
      });

      for (const doc of docs) {
        if (doc.content) {
          lastMessage.parts.push({
            type: "text",
            text: `\n\n[Referenced Document: "${doc.title}"]\n\n${doc.content}`,
          } as any);

          logger.debug("Attached document to message", {
            documentId: doc.id,
            title: doc.title,
          });
        }
      }
    }
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
            type: "data-chatCreated",
            data: { chatId: createdChat.id },
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
  ): Promise<Record<string, Tool>>;
  protected abstract executeChat(
    writer: UIMessageStreamWriter<CustomUIMessage>,
  ): Promise<void>;
  protected abstract handleError(error: any): string;
}
