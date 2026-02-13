import * as z from "zod";

import { itemsPerPageSchema } from "@workspace/api-routes/schemas/items-per-page-schema.js";
import { pageNumberSchema } from "@workspace/api-routes/schemas/page-number-schema.js";
import { type Bindings } from "@workspace/api-routes/types/bindings.js";
import { type Variables } from "@workspace/api-routes/types/variables.js";
import { db } from "@workspace/server/drizzle/db.js";
import { chats } from "@workspace/server/drizzle/schema.js";
import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const querySchema = z
  .object({
    pageNumber: pageNumberSchema,
    itemsPerPage: itemsPerPageSchema,
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
    const { pageNumber, itemsPerPage } = c.req.valid("query");
    const user = c.get("user");

    const userChats = await db
      .select()
      .from(chats)
      .where(eq(chats.userId, user.id))
      .orderBy(desc(chats.createdAt))
      .limit(itemsPerPage)
      .offset(pageNumber * itemsPerPage);

    return c.json(userChats);
  },
);

export default app;
