import * as z from "zod";

import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { type Bindings } from "@workspace/api-routes/types/bindings.js";
import { type Variables } from "@workspace/api-routes/types/variables.js";
import { db } from "@workspace/server/drizzle/db.js";
import { diffs } from "@workspace/server/drizzle/schema/schema.js";
import { count, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const paramSchema = z.object({ documentId: uuidSchema }).strict();
const querySchema = z
  .object({ version: z.coerce.number().int().min(0) })
  .strict();

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
    const { documentId } = c.req.valid("param");
    //   const user = c.get("user");

    //   // Verify document ownership
    //   const document = await db
    //     .select({ id: documents.id })
    //     .from(documents)
    //     .where(and(eq(documents.id, documentId), eq(documents.owner, user.id)))
    //     .limit(1);

    //   if (document.length === 0) {
    //     throw new HTTPException(404, { message: "NOT_FOUND" });
    //   }

    // Count the number of diffs (previous versions)
    const result = await db
      .select({ count: count() })
      .from(diffs)
      .where(eq(diffs.documentId, documentId));

    return c.json({ count: result[0].count });
  },
);

export default app;
