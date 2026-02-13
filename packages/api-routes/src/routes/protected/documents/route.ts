import * as z from "zod";

import { artifactKinds } from "@workspace/api-routes/lib/artifacts/artifact-server.js";
import { itemsPerPageSchema } from "@workspace/api-routes/schemas/items-per-page-schema.js";
import { pageNumberSchema } from "@workspace/api-routes/schemas/page-number-schema.js";
import { type Bindings } from "@workspace/api-routes/types/bindings.js";
import { type Variables } from "@workspace/api-routes/types/variables.js";
import { generateUUID } from "@workspace/api-routes/utils/generate-uuid.js";
import { db } from "@workspace/server/drizzle/db.js";
import { documents } from "@workspace/server/drizzle/schema.js";
import { eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const querySchema = z
  .object({
    pageNumber: pageNumberSchema,
    itemsPerPage: itemsPerPageSchema,
  })
  .strict();

const jsonSchema = z
  .object({
    title: z.string().min(1).max(128),
    content: z.string().min(1).max(4096),
    kind: z.enum(artifactKinds),
  })
  .strict();

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()
  .get(
    "/",
    validator("query", (value, c) => {
      const parsed = querySchema.safeParse(value);
      if (!parsed.success) {
        throw new HTTPException(400, { message: "BAD_REQUEST" });
      }
      return parsed.data;
    }),
    async (c) => {
      const { pageNumber, itemsPerPage } = c.req.valid("query");
      const user = c.get("user");

      const result = await db()
        .select({
          id: documents.id,
          title: documents.title,
          content: sql<string>`SUBSTRING(${documents.content}, 1, 50)`.as(
            "content",
          ),
          kind: documents.kind,
          createdAt: documents.createdAt,
        })
        .from(documents)
        .where(eq(documents.owner, user.id))
        .limit(itemsPerPage)
        .offset(pageNumber * itemsPerPage);

      return c.json(result);
    },
  )
  .post(
    "/",
    validator("json", async (value, c) => {
      const parsed = jsonSchema.safeParse(value);
      if (!parsed.success) {
        throw new HTTPException(400, { message: "BAD_REQUEST" });
      }
      return parsed.data;
    }),
    async (c) => {
      const { title, content, kind } = c.req.valid("json");
      const user = c.get("user");

      const result = await db()
        .insert(documents)
        .values({
          id: generateUUID(),
          title,
          content,
          kind,
          owner: user.id,
        })
        .returning({ id: documents.id });

      if (result.length === 0) {
        throw new HTTPException(500, { message: "Failed to create document" });
      }

      return c.json({
        id: result[0].id,
      });
    },
  );

export default app;
