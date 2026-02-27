import { Hono } from "hono";

// Import handlers
import artifactsGetSignedUrlRoute from "./artifacts/get-signed-url/[fileId]/[extension]/route.js";
import attachmentsGetSignedUrlRoute from "./attachments/get-signed-url/route.js";
import chatRoute from "./chat/route.js";
import chatsByIdRoute from "./chats/[chatId]/route.js";
import chatsFavourites from "./chats/favourites/route.js";
import chatsForkRoute from "./chats/fork/[chatId]/route.js";
import chatsIlike from "./chats/ilike/route.js";
import chatsIsFavouriteRoute from "./chats/is-favourite/[chatId]/route.js";
import chatsRoute from "./chats/route.js";
import chatsTitleRoute from "./chats/title/[chatId]/route.js";
import completionRoute from "./completion/route.js";
import documentsDocumentIdRoute from "./documents/[documentId]/route.js";
import documentsIlike from "./documents/ilike/route.js";
import documentsRoute from "./documents/route.js";
import documentsTitleRoute from "./documents/title/[documentId]/[title]/route.js";
import documentsVersionRoute from "./documents/version/[documentId]/route.js";
import documentsVersionsRoute from "./documents/versions/[documentId]/route.js";
import filesFileIdRoute from "./files/[fileId]/route.js";
import filesGetSignedUrlFolderFileRoute from "./files/get-signed-url/[folderId]/[fileId]/route.js";
import filesGetSignedUrlFolderRoute from "./files/get-signed-url/[folderId]/route.js";
import filesIlike from "./files/ilike/route.js";
import filesRoute from "./files/route.js";
import filterRoute from "./filter/[chatId]/route.js";
import foldersDeleteRoute from "./folders/[folderId]/route.js";
import foldersIlike from "./folders/ilike/route.js";
import foldersRequestAccessRoute from "./folders/request-access/route.js";
import foldersRoute from "./folders/route.js";
import foldersValidateAccessRoute from "./folders/validate-access/route.js";
import messagesRoute from "./messages/[chatId]/route.js";
import deleteMessagePairRoute from "./messages/delete-pair/[messageId]/route.js";
import trailingMessagesRoute from "./messages/delete-trailing/[messageId]/route.js";
import profilesRoute from "./profiles/route.js";
import promptsDeleteRoute from "./prompts/[promptId]/route.js";
import promptsIlike from "./prompts/ilike/route.js";
import promptsRoute from "./prompts/route.js";
import searchRoute from "./search/route.js";

// Important: Move routes with slugs to the end to prevent route conflicts

const protectedApiRouter = new Hono()
  // Artifacts
  .route(
    "/artifacts/get-signed-url/:fileId/:extension",
    artifactsGetSignedUrlRoute,
  )

  // Attachments
  .route("/attachments/get-signed-url", attachmentsGetSignedUrlRoute)

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

  // Documents
  .route("/documents", documentsRoute)
  .route("/documents/ilike", documentsIlike)
  .route("/documents/title/:documentId/:title", documentsTitleRoute)
  .route("/documents/version/:documentId", documentsVersionRoute)
  .route("/documents/versions/:documentId", documentsVersionsRoute)
  .route("/documents/:documentId", documentsDocumentIdRoute)

  // Files
  .route("/files", filesRoute)
  .route(
    "/files/get-signed-url/:folderId/:fileId",
    filesGetSignedUrlFolderFileRoute,
  )
  .route("/files/get-signed-url/:folderId", filesGetSignedUrlFolderRoute)
  .route("/files/ilike", filesIlike)
  .route("/files/:fileId", filesFileIdRoute)

  // Filter
  .route("/filter/:chatId", filterRoute)

  // Folders
  .route("/folders", foldersRoute)
  .route("/folders/ilike", foldersIlike)
  .route("/folders/request-access", foldersRequestAccessRoute)
  .route("/folders/validate-access", foldersValidateAccessRoute)
  .route("/folders/:folderId", foldersDeleteRoute)

  // Messages
  .route("/messages/delete-pair/:messageId", deleteMessagePairRoute)
  .route("/messages/delete-trailing/:messageId", trailingMessagesRoute)
  .route("/messages/:chatId", messagesRoute)

  // Profiles
  .route("/profiles", profilesRoute)

  // Prompts
  .route("/prompts", promptsRoute)
  .route("/prompts/:promptId", promptsDeleteRoute)
  .route("/prompts/ilike", promptsIlike)

  // Search
  .route("/search", searchRoute);

export { protectedApiRouter };
export type ProtectedApiType = typeof protectedApiRouter;
