import { completionModelIdx } from "@workspace/api-routes/providers/models.js";
import { completionSystemPrompt } from "@workspace/api-routes/providers/prompts.js";
import { getModel } from "@workspace/api-routes/providers/providers.js";
import { type Bindings } from "@workspace/api-routes/types/bindings.js";
import { type Variables } from "@workspace/api-routes/types/variables.js";
import { generateText } from "ai";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { completionSchema } from "./schema.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>().post(
  "/",
  validator("json", async (value, c) => {
    const parsed = completionSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }
    return parsed.data;
  }),
  async (c) => {
    const { context } = c.req.valid("json");

    const config = await getModel(c.env, completionModelIdx);

    const completionResult = await generateText({
      system: completionSystemPrompt,
      model: config.model,
      messages: [{ role: "user", content: context }],
      maxOutputTokens: 64,
    });

    const completion = completionResult.text.slice(3);

    return c.json({ completion });
  },
);

export default app;
