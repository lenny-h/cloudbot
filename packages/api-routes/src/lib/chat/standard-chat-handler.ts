import { db } from "@workspace/server/drizzle/db.js";
import { files, folders } from "@workspace/server/drizzle/schema.js";
import { createLogger } from "@workspace/server/logger/logger.js";
import {
  stepCountIs,
  streamText,
  type Tool,
  type UIMessageStreamWriter,
} from "ai";
import { inArray } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { standardSystemPrompt } from "../../providers/prompts.js";
import { type Bindings } from "../../types/bindings.js";
import { type CustomUIMessage } from "../../types/custom-ui-message.js";
import {
  type FileMetadata,
  filterAuthorizedFiles,
} from "../../utils/filter-authorized-files.js";
import {
  filterAuthorizedFolders,
  type FolderMetadata,
} from "../../utils/filter-authorized-folders.js";
import { generateUUID } from "../../utils/generate-uuid.js";
import { getPromptsByIds } from "../queries/prompts.js";
import { createDocument } from "../tools/create-document.js";
import { extractFromDocuments } from "../tools/extract-from-documents.js";
import { extractFromWeb } from "../tools/extract-from-web.js";
import { generateFile } from "../tools/generate-file.js";
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

  protected async retrieveToolSet(
    writer: UIMessageStreamWriter<CustomUIMessage>,
  ): Promise<Record<string, Tool>> {
    const contextFilter = this.getContextFilter();

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
      generateFile: generateFile({
        env: this.env,
        userId: this.request.user.id,
        dataStream: writer,
      }),
    };

    // Only include extractFromDocuments if context filter has files or folders
    if (
      contextFilter &&
      ((contextFilter.files && contextFilter.files.length > 0) ||
        (contextFilter.folders && contextFilter.folders.length > 0))
    ) {
      // Check permissions and get authorized file metadata
      let authorizedFileMetadata: FileMetadata[] = [];
      let authorizedFolderMetadata: FolderMetadata[] = [];

      // Check files if present
      if (contextFilter.files && contextFilter.files.length > 0) {
        const fileIds = contextFilter.files.map((f) => f.id);
        const requestedFiles = await db()
          .select({
            id: files.id,
            visibility: files.visibility,
            folderId: files.folderId,
            owner: files.owner,
          })
          .from(files)
          .where(inArray(files.id, fileIds));

        const authorizedFileMetadata = await filterAuthorizedFiles(
          requestedFiles,
          this.request.user.id,
        );

        if (authorizedFileMetadata.length !== fileIds.length) {
          logger.warn("User does not have access to all referenced files", {
            userId: this.request.user.id,
            requestedFiles: fileIds.length,
            authorizedFiles: authorizedFileMetadata.length,
          });
          throw new HTTPException(403, {
            message: "You do not have permission to access one or more files",
          });
        }
      }
      // Check folders only if no files are present
      else if (contextFilter.folders && contextFilter.folders.length > 0) {
        const folderIds = contextFilter.folders.map((c) => c.id);
        const requestedFolders = await db()
          .select({
            id: folders.id,
            visibility: folders.visibility,
            folderId: folders.id,
            owner: folders.owner,
          })
          .from(folders)
          .where(inArray(folders.id, folderIds));

        const authorizedFolderMetadata = await filterAuthorizedFolders(
          requestedFolders,
          this.request.user.id,
        );

        if (authorizedFolderMetadata.length !== folderIds.length) {
          logger.warn("User does not have access to all referenced folders", {
            userId: this.request.user.id,
            requestedFolders: folderIds.length,
            authorizedFolders: authorizedFolderMetadata.length,
          });
          throw new HTTPException(403, {
            message: "You do not have permission to access one or more folders",
          });
        }
      }

      tools.extractFromDocuments = extractFromDocuments({
        env: this.env,
        userId: this.request.user.id,
        fileMetadata: authorizedFileMetadata,
        folderMetadata: authorizedFolderMetadata,
        dataStream: writer,
      });
    }

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
    const tools = await this.retrieveToolSet(writer);

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
