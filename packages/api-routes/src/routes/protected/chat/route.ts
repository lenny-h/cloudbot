import * as z from "zod";

import { ChatHandlerFactory } from "@workspace/api-routes/lib/chat/index.js";
import {
  deleteChatById,
  getChatById,
} from "@workspace/api-routes/lib/queries/chats.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { type Bindings } from "@workspace/api-routes/types/bindings.js";
import { type Variables } from "@workspace/api-routes/types/variables.js";
import { db } from "@workspace/server/drizzle/db.js";
import { chats } from "@workspace/server/drizzle/schema.js";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const patchQuerySchema = z
  .object({
    id: uuidSchema,
    fav: z.boolean(),
  })
  .strict();

const deleteQuerySchema = z
  .object({
    id: uuidSchema,
  })
  .strict();

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()
  .post("/", async (c) => {
    const handler = await ChatHandlerFactory.createStandardChatHandler(c);
    return await handler.handleRequest();
  })
  .patch(
    "/",
    validator("query", (value, c) => {
      const parsed = patchQuerySchema.safeParse(value);
      if (!parsed.success) {
        throw new HTTPException(400, { message: "BAD_REQUEST" });
      }
      return parsed.data;
    }),
    async (c) => {
      const { id, fav: isFavourite } = c.req.valid("query");
      const user = c.get("user");

      const result = await db()
        .update(chats)
        .set({ isFavourite })
        .where(and(eq(chats.id, id), eq(chats.userId, user.id)))
        .returning();

      if (result.length === 0) {
        throw new HTTPException(404, { message: "NOT_FOUND" });
      }

      const updatedChat = result[0];

      return c.json({ updatedChat });
    },
  )
  .delete(
    "/",
    validator("query", (value, c) => {
      const parsed = deleteQuerySchema.safeParse(value);
      if (!parsed.success) {
        throw new HTTPException(400, { message: "BAD_REQUEST" });
      }
      return parsed.data;
    }),
    async (c) => {
      const { id } = c.req.valid("query");
      const user = c.get("user");

      const chat = await getChatById({ id });

      if (!chat || chat.userId !== user.id) {
        throw new HTTPException(404, { message: "NOT_FOUND" });
      }

      await deleteChatById({ id });

      return c.json({ message: "Chat deleted" });
    },
  );

export default app;
