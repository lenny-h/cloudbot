import * as z from "zod";

import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { type Bindings } from "@workspace/api-routes/types/bindings.js";
import { type Variables } from "@workspace/api-routes/types/variables.js";
import { db } from "@workspace/server/drizzle/db.js";
import { prompts } from "@workspace/server/drizzle/schema/schema.js";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { patchPromptSchema } from "./schema.js";

const paramSchema = z.object({ promptId: uuidSchema }).strict();

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()
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
      const parsed = patchPromptSchema.safeParse(value);
      if (!parsed.success) {
        throw new HTTPException(400, { message: "BAD_REQUEST" });
      }
      return parsed.data;
    }),
    async (c) => {
      const { promptId } = c.req.valid("param");
      const { content } = c.req.valid("json");
      const user = c.get("user");

      await db
        .update(prompts)
        .set({ content })
        .where(and(eq(prompts.id, promptId), eq(prompts.userId, user.id)));

      return c.json({ message: "Prompt updated" });
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
      const { promptId } = c.req.valid("param");
      const user = c.get("user");

      const deletedPrompt = await db
        .delete(prompts)
        .where(and(eq(prompts.id, promptId), eq(prompts.userId, user.id)))
        .returning({ name: prompts.name });

      const deletedPromptName = deletedPrompt[0]?.name;
      if (!deletedPromptName) {
        throw new HTTPException(404, { message: "NOT_FOUND" });
      }

      return c.json({ name: deletedPromptName });
    },
  );

export default app;
