import * as z from "zod";

import { getChatById } from "@workspace/api-routes/lib/queries/chats.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { type Bindings } from "@workspace/api-routes/types/bindings.js";
import { type Variables } from "@workspace/api-routes/types/variables.js";
import { generateUUID } from "@workspace/api-routes/utils/generate-uuid.js";
import { db } from "@workspace/server/drizzle/db.js";
import { chats, messages } from "@workspace/server/drizzle/schema.js";
import { and, desc, eq, lte, sql } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const MAX_FORKED_MESSAGES = 14;

const paramSchema = z.object({ chatId: uuidSchema }).strict();

const bodySchema = z
  .object({
    messageId: uuidSchema.optional(), // Optional: fork up to this message
  })
  .strict();

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>().post(
  "/",
  validator("param", (value, c) => {
    const parsed = paramSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }
    return parsed.data;
  }),
  validator("json", (value, c) => {
    const parsed = bodySchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }
    return parsed.data;
  }),
  async (c) => {
    const { chatId } = c.req.valid("param");
    const { messageId } = c.req.valid("json");
    const user = c.get("user");

    // Check if user owns the chat
    const chat = await getChatById({ id: chatId });
    if (!chat || chat.userId !== user.id) {
      throw new HTTPException(404, { message: "NOT_FOUND" });
    }

    let messagesToCopy;
    if (messageId) {
      // Get the last MAX_FORKED_MESSAGES messages up to and including the target message
      // Order by DESC to get the most recent ones, then reverse for chronological order
      // We use a subquery for the timestamp to avoid precision loss with JS Date
      const recentMessages = await db()
        .select({
          role: messages.role,
          parts: messages.parts,
          metadata: messages.metadata,
        })
        .from(messages)
        .where(
          and(
            eq(messages.chatId, chatId),
            lte(
              messages.createdAt,
              sql`(select ${messages.createdAt} from ${messages} where ${messages.id} = ${messageId})`,
            ),
          ),
        )
        .orderBy(desc(messages.createdAt))
        .limit(MAX_FORKED_MESSAGES);

      // Reverse to get chronological order
      messagesToCopy = recentMessages.reverse();
    } else {
      // Get the last MAX_FORKED_MESSAGES messages
      // Order by DESC to get the most recent ones, then reverse for chronological order
      const recentMessages = await db()
        .select({
          role: messages.role,
          parts: messages.parts,
          metadata: messages.metadata,
        })
        .from(messages)
        .where(eq(messages.chatId, chatId))
        .orderBy(desc(messages.createdAt))
        .limit(MAX_FORKED_MESSAGES);

      // Reverse to get chronological order
      messagesToCopy = recentMessages.reverse();
    }

    // Create new chat with "(Fork)" suffix
    const newChatResult = await db()
      .insert(chats)
      .values({
        id: generateUUID(),
        userId: user.id,
        title: `${chat.title} (Fork)`,
        isFavourite: false,
      })
      .returning();

    const newChat = newChatResult[0];
    if (!newChat) {
      throw new HTTPException(500, { message: "INTERNAL_SERVER_ERROR" });
    }

    // Copy messages to new chat
    if (messagesToCopy.length > 0) {
      const baseCreatedAt = new Date();
      await db().insert(messages).values(
        messagesToCopy.map((msg, index) => ({
          id: generateUUID(),
          chatId: newChat.id,
          role: msg.role,
          parts: msg.parts,
          metadata: msg.metadata,
          createdAt: new Date(baseCreatedAt.getTime() + index * 10), // Ensure order
        })),
      );
    }

    return c.json({
      id: newChat.id,
      title: newChat.title,
    });
  },
);

export default app;
