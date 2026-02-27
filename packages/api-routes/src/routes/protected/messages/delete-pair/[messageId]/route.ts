import * as z from "zod";

import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { type Bindings } from "@workspace/api-routes/types/bindings.js";
import { type Variables } from "@workspace/api-routes/types/variables.js";
import { db } from "@workspace/server/drizzle/db.js";
import { chats, messages } from "@workspace/server/drizzle/schema.js";
import { and, asc, eq, gt, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const paramSchema = z.object({ messageId: uuidSchema }).strict();

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>().delete(
  "/",
  validator("param", (value, c) => {
    const parsed = paramSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }
    return parsed.data;
  }),
  async (c) => {
    const { messageId } = c.req.valid("param");
    const user = c.get("user");

    // Fetch the target message and verify ownership
    const result = await db()
      .select({
        id: messages.id,
        chatId: messages.chatId,
        createdAt: messages.createdAt,
        role: messages.role,
        owner: chats.userId,
      })
      .from(messages)
      .innerJoin(chats, eq(messages.chatId, chats.id))
      .where(eq(messages.id, messageId))
      .limit(1);

    const messageData = result[0];
    if (!messageData || messageData.owner !== user.id) {
      throw new HTTPException(404, { message: "NOT_FOUND" });
    }

    const idsToDelete = [messageData.id];

    // Find the immediately following message (the agent response)
    const nextMessages = await db()
      .select({ id: messages.id })
      .from(messages)
      .where(
        and(
          eq(messages.chatId, messageData.chatId),
          gt(messages.createdAt, messageData.createdAt),
        ),
      )
      .orderBy(asc(messages.createdAt))
      .limit(1);

    if (nextMessages.length > 0) {
      idsToDelete.push(nextMessages[0].id);
    }

    await db().delete(messages).where(inArray(messages.id, idsToDelete));

    return c.json({ deleted: idsToDelete });
  },
);

export default app;
