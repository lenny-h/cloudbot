import * as z from "zod";

import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { type Bindings } from "@workspace/api-routes/types/bindings.js";
import { type Variables } from "@workspace/api-routes/types/variables.js";
import { db } from "@workspace/server/drizzle/db.js";
import { chats, messages } from "@workspace/server/drizzle/schema/schema.js";
import { and, eq, gte } from "drizzle-orm";
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

    const result = await db
      .select({
        chatId: messages.chatId,
        createdAt: messages.createdAt,
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

    await db
      .delete(messages)
      .where(
        and(
          eq(messages.chatId, messageData.chatId),
          gte(messages.createdAt, messageData.createdAt),
        ),
      );

    return c.json({ message: "Trailing messages deleted" });
  },
);

export default app;
