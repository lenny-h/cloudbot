import * as z from "zod";

import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { type Bindings } from "@workspace/api-routes/types/bindings.js";
import { type Variables } from "@workspace/api-routes/types/variables.js";
import { db } from "@workspace/server/drizzle/db.js";
import { diffs, documents } from "@workspace/server/drizzle/schema.js";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const paramSchema = z.object({ diffId: uuidSchema }).strict();

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>().patch(
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

    // Fetch the diff and verify ownership
    const diff = await db()
      .select({
        id: diffs.id,
        documentId: diffs.documentId,
        newText: diffs.newText,
        isResolved: diffs.isResolved,
      })
      .from(diffs)
      .where(and(eq(diffs.id, diffId), eq(diffs.owner, user.id)))
      .limit(1);

    if (diff.length === 0) {
      throw new HTTPException(404, { message: "NOT_FOUND" });
    }

    // Update the document content with the new text from the diff
    const updateResult = await db()
      .update(documents)
      .set({ content: diff[0].newText })
      .where(
        and(eq(documents.id, diff[0].documentId), eq(documents.owner, user.id)),
      )
      .returning({ id: documents.id });

    if (updateResult.length === 0) {
      throw new HTTPException(404, { message: "DOCUMENT_NOT_FOUND" });
    }

    return c.json({ documentId: diff[0].documentId });
  },
);

export default app;
