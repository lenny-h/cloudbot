import * as z from "zod";

import { filterAuthorizedFiles } from "@workspace/api-routes/utils/filter-authorized-files.js";
import { prefixSchema } from "@workspace/api-routes/schemas/prefix-schema.js";
import { createUuidArraySchema } from "@workspace/api-routes/schemas/uuid-array-schema.js";
import { type Bindings } from "@workspace/api-routes/types/bindings.js";
import { type Variables } from "@workspace/api-routes/types/variables.js";
import { db } from "@workspace/server/drizzle/db.js";
import { files } from "@workspace/server/drizzle/schema/schema.js";
import { and, desc, ilike, inArray, sql } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const querySchema = z
  .object({
    prefix: prefixSchema,
    courseIds: createUuidArraySchema(20),
  })
  .strict();

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>().get(
  "/",
  validator("query", (value, c) => {
    const parsed = querySchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }
    return parsed.data;
  }),
  async (c) => {
    const { prefix, courseIds } = c.req.valid("query");
    const user = c.get("user");

    const result = await db
      .select()
      .from(files)
      .where(
        and(
          inArray(files.courseId, courseIds),
          ilike(files.name, sql`${prefix} || '%'`),
        ),
      )
      .orderBy(desc(files.createdAt))
      .limit(5);

    const authorizedFiles = await filterAuthorizedFiles(result, user.id);

    return c.json(authorizedFiles);
  },
);

export default app;
