import * as z from "zod";

import { itemsPerPageSchema } from "@workspace/api-routes/schemas/items-per-page-schema.js";
import { filterAuthorizedFiles } from "@workspace/api-routes/utils/filter-authorized-files.js";
import { pageNumberSchema } from "@workspace/api-routes/schemas/page-number-schema.js";
import { createUuidArraySchema } from "@workspace/api-routes/schemas/uuid-array-schema.js";
import { type Bindings } from "@workspace/api-routes/types/bindings.js";
import { type Variables } from "@workspace/api-routes/types/variables.js";
import { db } from "@workspace/server/drizzle/db.js";
import { files } from "@workspace/server/drizzle/schema/schema.js";
import { inArray } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

// Private courses have their files stored with the key format: `${user.id}/{courseId}/{fileName}`
// Protected and public courses have their files stored with the key format: `{visibility}/{courseId}/{fileName}`

const querySchema = z
  .object({
    courseIds: createUuidArraySchema(20),
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
    const { courseIds, pageNumber, itemsPerPage } = c.req.valid("query");
    const user = c.get("user");

    const result = await db
      .select()
      .from(files)
      .where(inArray(files.courseId, courseIds))
      .limit(itemsPerPage)
      .offset(pageNumber * itemsPerPage);

    const authorizedFiles = await filterAuthorizedFiles(result, user.id);

    return c.json(authorizedFiles);
  },
);

export default app;
