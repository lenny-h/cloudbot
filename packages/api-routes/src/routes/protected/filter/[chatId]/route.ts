import * as z from "zod";

import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { type Bindings } from "@workspace/api-routes/types/bindings.js";
import { type CustomUIMetadata } from "@workspace/api-routes/types/custom-ui-metadata.js";
import { type Variables } from "@workspace/api-routes/types/variables.js";
import { db } from "@workspace/server/drizzle/db.js";
import {
  chats,
  documents,
  files,
  folders,
  messages,
  prompts,
} from "@workspace/server/drizzle/schema.js";
import { and, desc, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const paramSchema = z.object({ chatId: uuidSchema }).strict();

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>().get(
  "/",
  validator("param", (value, c) => {
    const parsed = paramSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }
    return parsed.data;
  }),
  async (c) => {
    const { chatId } = c.req.valid("param");
    const user = c.get("user");

    // Check if the chat exists and belongs to the user
    const chat = await db()
      .select({ id: chats.id })
      .from(chats)
      .where(and(eq(chats.id, chatId), eq(chats.userId, user.id)))
      .limit(1);

    if (!chat[0]) {
      throw new HTTPException(404, { message: "NOT_FOUND" });
    }

    // Fetch the last user message for the given chatId
    const lastMessageResult = await db()
      .select({
        metadata: messages.metadata,
      })
      .from(messages)
      .where(and(eq(messages.chatId, chatId), eq(messages.role, "user")))
      .orderBy(desc(messages.createdAt))
      .limit(1);

    // If no messages or no filter in metadata, return empty filter
    const messageMetadata = lastMessageResult[0]?.metadata as CustomUIMetadata;
    if (!messageMetadata || !messageMetadata.contextFilter) {
      return c.json({
        prompts: [],
        folders: [],
        files: [],
        documents: [],
      });
    }

    const contextFilter = messageMetadata.contextFilter;

    // Parallelize all database fetches
    const [promptsData, foldersData, filesData, documentsData] =
      await Promise.all([
        // Fetch prompt details if prompts exist
        contextFilter.prompts.length > 0
          ? db()
              .select({
                id: prompts.id,
                name: prompts.name,
                content: prompts.content,
              })
              .from(prompts)
              .where(
                and(
                  inArray(
                    prompts.id,
                    contextFilter.prompts.map((p: { id: string }) => p.id),
                  ),
                ),
              )
          : Promise.resolve([]),
        // Fetch folder details if folders exist
        contextFilter.folders.length > 0
          ? db()
              .select({
                id: folders.id,
                name: folders.name,
              })
              .from(folders)
              .where(
                and(
                  inArray(
                    folders.id,
                    contextFilter.folders.map((f: { id: string }) => f.id),
                  ),
                ),
              )
          : Promise.resolve([]),
        // Fetch file details if files exist
        contextFilter.files.length > 0
          ? db()
              .select({
                id: files.id,
                name: files.name,
              })
              .from(files)
              .where(
                and(
                  inArray(
                    files.id,
                    contextFilter.files.map((f: { id: string }) => f.id),
                  ),
                ),
              )
          : Promise.resolve([]),
        // Fetch document details if documents exist
        contextFilter.documents.length > 0
          ? db()
              .select({
                id: documents.id,
                title: documents.title,
                kind: documents.kind,
              })
              .from(documents)
              .where(
                and(
                  inArray(
                    documents.id,
                    contextFilter.documents.map((d: { id: string }) => d.id),
                  ),
                ),
              )
          : Promise.resolve([]),
      ]);

    // Build the context filter response
    const responseFilter = {
      prompts: promptsData.map((prompt) => ({
        id: prompt.id,
        name: prompt.name,
        content: prompt.content,
      })),
      folders: foldersData.map((course) => ({
        id: course.id,
        name: course.name,
      })),
      files: filesData.map((file) => ({
        id: file.id,
        name: file.name,
      })),
      documents: documentsData.map((doc) => ({
        id: doc.id,
        title: doc.title,
        kind: doc.kind,
      })),
    };

    return c.json(responseFilter);
  },
);

export default app;
