import * as z from "zod";

import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { type Bindings } from "@workspace/api-routes/types/bindings.js";
import { type Variables } from "@workspace/api-routes/types/variables.js";
import { db } from "@workspace/server/drizzle/db.js";
import { diffs, documents } from "@workspace/server/drizzle/schema.js";
import { and, asc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const paramSchema = z.object({ documentId: uuidSchema }).strict();
const querySchema = z
  .object({ version: z.coerce.number().int().min(0).max(16) }) // Limit max version to prevent abuse
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
  validator("query", (value, c) => {
    const parsed = querySchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }
    return parsed.data;
  }),
  async (c) => {
    const { documentId } = c.req.valid("param");
    const { version } = c.req.valid("query");
    const user = c.get("user");

    // Verify document ownership
    const document = await db()
      .select({ id: documents.id })
      .from(documents)
      .where(and(eq(documents.id, documentId), eq(documents.owner, user.id)))
      .limit(1);

    if (document.length === 0) {
      throw new HTTPException(404, { message: "NOT_FOUND" });
    }

    // Get all diffs ordered by creation date (newest first)
    const allDiffs = await db()
      .select({
        id: diffs.id,
      })
      .from(diffs)
      .where(eq(diffs.documentId, documentId))
      .orderBy(asc(diffs.createdAt))
      .limit(version + 1); // Only fetch up to the requested version

    if (allDiffs.length <= version) {
      throw new HTTPException(404, { message: "NOT_FOUND" });
    }

    const requestedDiff = await db()
      .select({
        previousText: diffs.previousText,
        createdAt: diffs.createdAt,
      })
      .from(diffs)
      .where(eq(diffs.id, allDiffs[version].id))
      .limit(1);

    if (requestedDiff.length === 0) {
      throw new HTTPException(404, { message: "NOT_FOUND" });
    }

    // Return the specific version
    return c.json(requestedDiff[0]);
  },
);

export default app;
