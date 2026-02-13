import { db } from "@workspace/server/drizzle/db.js";
import { messages } from "@workspace/server/drizzle/schema.js";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { type CustomUIMessage } from "../../types/custom-ui-message.js";

export async function getMessageById({ messageId }: { messageId: string }) {
  const result = await db
    .select({ chatId: messages.chatId, createdAt: messages.createdAt })
    .from(messages)
    .where(eq(messages.id, messageId));

  if (result.length === 0) {
    throw new HTTPException(404, { message: "NOT_FOUND" });
  }

  return result[0];
}

export async function getMessagesByChatId({
  chatId,
  messageCount,
}: {
  chatId: string;
  messageCount: number;
}) {
  return (await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(desc(messages.createdAt))
    .limit(messageCount)) as CustomUIMessage[];
}

export async function saveMessages({
  chatId,
  newMessages,
}: {
  chatId: string;
  newMessages: CustomUIMessage[];
}) {
  const messagesToInsert = newMessages.map((msg) => ({
    chatId,
    ...msg,
  }));

  return await db
    .insert(messages)
    .values(messagesToInsert)
    .onConflictDoUpdate({
      target: messages.id,
      set: {
        chatId: sql`excluded.chat_id`,
        role: sql`excluded.role`,
        parts: sql`excluded.parts`,
        metadata: sql`excluded.metadata`,
      },
    })
    .returning();
}

export async function deleteLastMessagePair({ chatId }: { chatId: string }) {
  // Delete the last two messages in the chat
  const lastTwoMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(desc(messages.createdAt))
    .limit(2);

  const messageIdsToDelete = lastTwoMessages.map((msg) => msg.id);

  await db.delete(messages).where(inArray(messages.id, messageIdsToDelete));
}
