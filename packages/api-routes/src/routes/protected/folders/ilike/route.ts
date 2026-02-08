import * as z from "zod";

import { prefixSchema } from "@workspace/api-routes/schemas/prefix-schema.js";
import { Bindings } from "@workspace/api-routes/types/bindings.js";
import { Variables } from "@workspace/api-routes/types/variables.js";
import { db } from "@workspace/server/drizzle/db.js";
import { folders } from "@workspace/server/drizzle/schema/schema.js";
import { and, eq, ilike, ne, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const querySchema = z.object({ prefix: prefixSchema }).strict();

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
    const { prefix } = c.req.valid("query");
    const user = c.get("user");

    const result = await db
      .select({
        id: folders.id,
        name: folders.name,
        visibility: folders.visibility,
      })
      .from(folders)
      .where(
        and(
          ilike(folders.name, sql`${prefix} || '%'`),
          or(ne(folders.visibility, "private"), eq(folders.owner, user.id)),
        ),
      )
      .limit(5);

    return c.json(result);
  },
);

export default app;
