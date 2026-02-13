import { type Bindings } from "@workspace/api-routes/types/bindings.js";
import { type Variables } from "@workspace/api-routes/types/variables.js";
import { generateUUID } from "@workspace/api-routes/utils/generate-uuid.js";
import { db } from "@workspace/server/drizzle/db.js";
import { prompts } from "@workspace/server/drizzle/schema.js";
import { count, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { insertPromptSchema } from "./schema.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()
  .get("/", async (c) => {
    const user = c.get("user");

    const result = await db
      .select({
        id: prompts.id,
        name: prompts.name,
        content: prompts.content,
      })
      .from(prompts)
      .where(eq(prompts.userId, user.id));

    return c.json(result);
  })
  .post(
    "/",
    validator("json", async (value, c) => {
      const parsed = insertPromptSchema.safeParse(value);
      if (!parsed.success) {
        throw new HTTPException(400, { message: "BAD_REQUEST" });
      }
      return parsed.data;
    }),
    async (c) => {
      const { name, content } = c.req.valid("json");
      const user = c.get("user");

      const result = await db
        .select({ count: count() })
        .from(prompts)
        .where(eq(prompts.userId, user.id));

      const promptsCount = result[0]?.count ?? 0;

      if (promptsCount >= 10) {
        throw new HTTPException(403, { message: "PROMPT_LIMIT_REACHED" });
      }

      await db.insert(prompts).values({
        id: generateUUID(),
        userId: user.id,
        name,
        content,
      });

      return c.json({ message: "Prompt inserted" });
    },
  );

export default app;
