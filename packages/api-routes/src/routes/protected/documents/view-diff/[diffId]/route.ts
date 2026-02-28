import * as z from "zod";

import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { type Bindings } from "@workspace/api-routes/types/bindings.js";
import { type Variables } from "@workspace/api-routes/types/variables.js";
import { db } from "@workspace/server/drizzle/db.js";
import { diffs } from "@workspace/server/drizzle/schema.js";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const paramSchema = z.object({ diffId: uuidSchema }).strict();

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
    const { diffId } = c.req.valid("param");
    const user = c.get("user");

    const result = await db()
      .select({
        newText: diffs.newText,
        documentId: diffs.documentId,
        kind: diffs.kind,
      })
      .from(diffs)
      .where(and(eq(diffs.id, diffId), eq(diffs.owner, user.id)))
      .limit(1);

    if (result.length === 0) {
      throw new HTTPException(404, { message: "NOT_FOUND" });
    }

    return c.json(result[0]);
  },
);

export default app;
