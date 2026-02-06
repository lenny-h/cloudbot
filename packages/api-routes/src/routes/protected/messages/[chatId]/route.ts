import * as z from "zod";

import { getChatById } from "@workspace/api-routes/lib/queries/chats.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { type Bindings } from "@workspace/api-routes/types/bindings.js";
import { type Variables } from "@workspace/api-routes/types/variables.js";
import { db } from "@workspace/server/drizzle/db.js";
import { messages } from "@workspace/server/drizzle/schema/schema.js";
import { asc, eq } from "drizzle-orm";
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

    const chat = await getChatById({ id: chatId });
    if (!chat || chat.userId !== user.id) {
      throw new HTTPException(404, { message: "NOT_FOUND" });
    }

    const result = await db
      .select({
        id: messages.id,
        role: messages.role,
        parts: messages.parts,
        metadata: messages.metadata,
      })
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(asc(messages.createdAt));

    return c.json(result);
  },
);

export default app;
