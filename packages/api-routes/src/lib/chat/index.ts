import { type Context } from "hono";
import { ChatRequest } from "./chat-request.js";
import { chatPayloadSchema } from "./schema.js";
import { StandardChatHandler } from "./standard-chat-handler.js";

export class ChatHandlerFactory {
  static async createStandardChatHandler(
    c: Context,
  ): Promise<StandardChatHandler> {
    const chatRequest = await ChatRequest.fromRequest(c, chatPayloadSchema);

    return new StandardChatHandler(c.env, chatRequest);
  }
}

export * from "./chat-handler.js";
export * from "./chat-request.js";
export * from "./standard-chat-handler.js";
