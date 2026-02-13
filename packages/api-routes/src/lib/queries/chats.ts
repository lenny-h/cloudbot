import { db } from "@workspace/server/drizzle/db.js";
import { chats } from "@workspace/server/drizzle/schema.js";
import { and, desc, eq, lt } from "drizzle-orm";

export async function getChatById({ id }: { id: string }) {
  const result = await db
    .select({
      userId: chats.userId,
      title: chats.title,
    })
    .from(chats)
    .where(eq(chats.id, id))
    .limit(1);

  if (result.length === 0) {
    return undefined;
  }

  return result[0];
}

export async function deleteChatById({ id }: { id: string }) {
  await db.delete(chats).where(eq(chats.id, id));
}

export async function getFavouriteChatsByUserId({
  id,
  cursor,
}: {
  id: string;
  cursor: string | null;
}) {
  const baseWhere = cursor
    ? and(
        eq(chats.userId, id),
        eq(chats.isFavourite, true),
        lt(chats.createdAt, new Date(cursor)),
      )
    : and(eq(chats.userId, id), eq(chats.isFavourite, true));

  const query = db
    .select()
    .from(chats)
    .where(baseWhere)
    .orderBy(desc(chats.createdAt))
    .limit(10);

  return await query;
}

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  const result = await db
    .insert(chats)
    .values({
      id,
      userId,
      title,
    })
    .returning();

  return result[0];
}
