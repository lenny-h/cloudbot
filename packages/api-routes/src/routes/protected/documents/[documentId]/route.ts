import * as z from "zod";

import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { type Bindings } from "@workspace/api-routes/types/bindings.js";
import { type Variables } from "@workspace/api-routes/types/variables.js";
import { db } from "@workspace/server/drizzle/db.js";
import { documents } from "@workspace/server/drizzle/schema.js";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const paramSchema = z.object({ documentId: uuidSchema }).strict();
const jsonSchema = z
  .object({
    content: z.string().min(1).max(4096),
  })
  .strict();

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
      const { documentId } = c.req.valid("param");
      const user = c.get("user");

      const result = await db
        .select({
          content: documents.content,
        })
        .from(documents)
        .where(and(eq(documents.id, documentId), eq(documents.owner, user.id)))
        .limit(1);

      if (result.length === 0) {
        throw new HTTPException(404, { message: "NOT_FOUND" });
      }

      return c.json(result[0]);
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
    validator("json", async (value, c) => {
      const parsed = jsonSchema.safeParse(value);
      if (!parsed.success) {
        throw new HTTPException(400, { message: "BAD_REQUEST" });
      }
      return parsed.data;
    }),
    async (c) => {
      const { documentId } = c.req.valid("param");
      const { content } = c.req.valid("json");
      const user = c.get("user");

      const result = await db
        .update(documents)
        .set({ content })
        .where(and(eq(documents.id, documentId), eq(documents.owner, user.id)))
        .returning({ id: documents.id });

      if (result.length === 0) {
        throw new HTTPException(404, { message: "NOT_FOUND" });
      }

      return c.json({ message: "Document saved" });
    },
  )
  .delete(
    "/",
    validator("param", (value, c) => {
      const parsed = paramSchema.safeParse(value);
      if (!parsed.success) {
        throw new HTTPException(400, { message: "BAD_REQUEST" });
      }
      return parsed.data;
    }),
    async (c) => {
      const { documentId } = c.req.valid("param");
      const user = c.get("user");

      const result = await db
        .delete(documents)
        .where(and(eq(documents.id, documentId), eq(documents.owner, user.id)))
        .returning({ id: documents.id });

      if (result.length === 0) {
        throw new HTTPException(404, { message: "NOT_FOUND" });
      }

      return c.json({ message: "Document deleted" });
    },
  );

export default app;
