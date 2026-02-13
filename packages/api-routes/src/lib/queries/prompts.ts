import { db } from "@workspace/server/drizzle/db.js";
import { prompts } from "@workspace/server/drizzle/schema.js";
import { and, eq, inArray } from "drizzle-orm";

export async function getPromptsByIds({
  ids,
  userId,
}: {
  ids: string[];
  userId: string;
}) {
  if (ids.length === 0) return [];

  return await db
    .select()
    .from(prompts)
    .where(and(inArray(prompts.id, ids), eq(prompts.userId, userId)));
}
