import * as z from "zod";

import { type User } from "@workspace/server/drizzle/schema.js";
import { createLogger } from "@workspace/server/logger/logger.js";
import { validateUIMessages } from "ai";
import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { dataSchemas } from "../../schemas/data-schemas.js";
import { metadataSchema } from "../../schemas/metadata-schema.js";
import { type CustomUIMessage } from "../../types/custom-ui-message.js";
import { type UserLocation } from "../../types/user-location.js";
import { getChatById } from "../queries/chats.js";
import { getMessagesByChatId } from "../queries/messages.js";
import { mockedTools } from "../tools/index.js";

const logger = createLogger("chat-request");

interface CloudflareRequest extends Request {
  cf?: Record<string, string>;
}

export class ChatRequest {
  public readonly id: string; // Chat ID
  public readonly user: User;
  public readonly messages: CustomUIMessage[];
  public readonly lastMessage: CustomUIMessage;
  public readonly createNewChat: boolean;
  public readonly modelIdx: number;
  public readonly isTemporary: boolean; // Whether to save the chat or not
  public readonly reasoningEnabled?: boolean;
  public readonly webSearchEnabled?: boolean;
  public readonly userLocation: UserLocation;

  constructor(
    id: string,
    user: User,
    messages: CustomUIMessage[],
    createNewChat: boolean,
    modelIdx: number,
    isTemporary: boolean,
    userLocation: UserLocation,
    reasoningEnabled?: boolean,
    webSearchEnabled?: boolean,
  ) {
    this.id = id;
    this.user = user;
    this.messages = messages;
    this.lastMessage = messages[messages.length - 1];
    this.createNewChat = createNewChat;
    this.modelIdx = modelIdx;
    this.isTemporary = isTemporary;
    this.userLocation = userLocation;
    this.reasoningEnabled = reasoningEnabled;
    this.webSearchEnabled = webSearchEnabled;

    logger.debug("ChatRequest constructed", {
      chatId: id,
      userId: user.id,
      messageCount: messages.length,
      isTemporary,
      reasoningEnabled,
      webSearchEnabled,
      userLocation,
    });
  }

  static async fromRequest(
    c: Context,
    schema: z.ZodType<any>,
  ): Promise<ChatRequest> {
    const payload = await c.req.json();

    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      logger.warn("ChatRequest payload validation failed", {
        error: z.treeifyError(parsed.error),
      });
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }
    const validatedPayload = parsed.data;

    const user = c.get("user");

    const {
      id,
      messages: incomingMessages,
      messageCount,
      modelIdx,
      temporary: isTemporary,
      reasoning: reasoningEnabled,
      webSearch: webSearchEnabled,
    } = validatedPayload;

    // Extract user location from Cloudflare's request.cf properties.
    // These are populated automatically by Cloudflare's edge network
    const cf = (c.req.raw as CloudflareRequest).cf;
    const userLocation: UserLocation = {
      city: cf?.city,
      region: cf?.region,
      regionCode: cf?.regionCode,
      country: cf?.country,
      timezone: cf?.timezone,
      latitude: cf?.latitude,
      longitude: cf?.longitude,
    };

    let createNewChat = false;
    let prevMessages: CustomUIMessage[] = [];

    // Check chat ownership and load messages for non-temporary chats
    if (!isTemporary) {
      const chat = await getChatById({ id });

      if (!chat) {
        createNewChat = true;
      } else if (chat.userId !== user.id) {
        logger.warn("User does not own chat", {
          chatId: id,
          userId: user.id,
        });
        throw new HTTPException(403, { message: "FORBIDDEN" });
      }

      // Load previous messages
      prevMessages = await getMessagesByChatId({
        chatId: id,
        messageCount: messageCount ? Math.min(messageCount, 12) : 12,
      });
    }

    const messages = [...prevMessages.reverse(), ...incomingMessages];

    let validatedUIMessages: CustomUIMessage[];
    try {
      validatedUIMessages = await validateUIMessages<CustomUIMessage>({
        messages,
        dataSchemas,
        metadataSchema,
        tools: mockedTools,
      });
    } catch (error) {
      logger.warn("Message validation failed", {
        chatId: id,
        userId: user.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }

    // Disallow file parts in chat messages
    // File parts should be handled as attachments, not inline in messages
    // Once the attachments are validated, they will be integrated into the last user message
    const containsFilePart = validatedUIMessages.some((m) => {
      return m.parts.some((p) => p.type === "file");
    });

    if (containsFilePart) {
      logger.warn("Request contains disallowed file parts in messages", {
        chatId: id,
        userId: user.id,
      });
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }

    return new ChatRequest(
      id,
      user,
      validatedUIMessages,
      createNewChat,
      modelIdx,
      isTemporary,
      userLocation,
      reasoningEnabled,
      webSearchEnabled,
    );
  }
}
