import * as z from "zod";

import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { type Bindings } from "@workspace/api-routes/types/bindings.js";
import { type Variables } from "@workspace/api-routes/types/variables.js";
import { db } from "@workspace/server/drizzle/db.js";
import { chats } from "@workspace/server/drizzle/schema.js";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { chatsTitleSchema } from "./schema.js";

const paramSchema = z.object({ chatId: uuidSchema }).strict();

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()
  .get(
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

      const result = await db
        .select({ title: chats.title })
        .from(chats)
        .where(and(eq(chats.id, chatId), eq(chats.userId, user.id)))
        .limit(1);

      const title = result[0]?.title;
      if (!title) {
        throw new HTTPException(404, { message: "NOT_FOUND" });
      }

      return c.json({ title });
    },
  )
  .patch(
    "/",
    validator("param", (value, c) => {
      const parsed = paramSchema.safeParse(value);
      if (!parsed.success) {
        throw new HTTPException(400, { message: "BAD_REQUEST" });
      }
      return parsed.data;
    }),
    validator("json", (value, c) => {
      const parsed = chatsTitleSchema.safeParse(value);
      if (!parsed.success) {
        throw new HTTPException(400, { message: "BAD_REQUEST" });
      }
      return parsed.data;
    }),
    async (c) => {
      const { chatId } = c.req.valid("param");
      const { title } = c.req.valid("json");
      const user = c.get("user");

      const result = await db
        .update(chats)
        .set({ title })
        .where(and(eq(chats.id, chatId), eq(chats.userId, user.id)));

      if (result.rowCount === 0) {
        throw new HTTPException(404, { message: "NOT_FOUND" });
      }

      return c.json({ message: "Chat title updated" });
    },
  );

export default app;
