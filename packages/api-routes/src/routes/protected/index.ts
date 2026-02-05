import "@workspace/server/types/hono.js";
import { Hono } from "hono";

// Import handlers
import chatRoute from "./chat/route.js";
import chatsByIdRoute from "./chats/[chatId]/route.js";
import chatsFavourites from "./chats/favourites/route.js";
import chatsForkRoute from "./chats/fork/[chatId]/route.js";
import chatsIlike from "./chats/ilike/route.js";
import chatsIsFavouriteRoute from "./chats/is-favourite/[chatId]/route.js";
import chatsRoute from "./chats/route.js";
import chatsTitleRoute from "./chats/title/[chatId]/route.js";
import completionRoute from "./completion/route.js";
import messagesRoute from "./messages/[chatId]/route.js";
import trailingMessagesRoute from "./messages/delete-trailing/[messageId]/route.js";
import promptsDeleteRoute from "./prompts/[promptId]/route.js";
import promptsIlike from "./prompts/ilike/route.js";
import promptsRoute from "./prompts/route.js";

// Important: Move routes with slugs to the end to prevent route conflicts

const protectedApiRouter = new Hono()
  // Chat
  .route("/chat", chatRoute)

  // Chats
  .route("/chats", chatsRoute)
  .route("/chats/favourites", chatsFavourites)
  .route("/chats/fork/:chatId", chatsForkRoute)
  .route("/chats/ilike", chatsIlike)
  .route("/chats/is-favourite/:chatId", chatsIsFavouriteRoute)
  .route("/chats/title/:chatId", chatsTitleRoute)
  .route("/chats/:chatId", chatsByIdRoute)

  // Completion
  .route("/completion", completionRoute)

  // Messages
  .route("/messages/delete-trailing/:messageId", trailingMessagesRoute)
  .route("/messages/:chatId", messagesRoute)

  // Prompts
  .route("/prompts", promptsRoute)
  .route("/prompts/:promptId", promptsDeleteRoute)
  .route("/prompts/ilike", promptsIlike);

export { protectedApiRouter };
export type ProtectedApiType = typeof protectedApiRouter;
