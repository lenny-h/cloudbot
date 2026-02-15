import * as z from "zod";

import { itemsPerPageSchema } from "@workspace/api-routes/schemas/items-per-page-schema.js";
import { pageNumberSchema } from "@workspace/api-routes/schemas/page-number-schema.js";
import { type Bindings } from "@workspace/api-routes/types/bindings.js";
import { type Variables } from "@workspace/api-routes/types/variables.js";
import { encryptApiKey } from "@workspace/api-routes/utils/encryption.js";
import { db } from "@workspace/server/drizzle/db.js";
import { folderUsers, folders } from "@workspace/server/drizzle/schema.js";
import { and, eq, or } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { createFolderSchema } from "./schema.js";

const querySchema = z
  .object({
    pageNumber: pageNumberSchema,
    itemsPerPage: itemsPerPageSchema,
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

      // Build the where clause to filter folders
      const whereConditions = or(
        eq(folders.visibility, "public"),
        eq(folders.visibility, "protected"),
        and(eq(folders.visibility, "private"), eq(folders.owner, user.id)),
      );

      const result = await db()
        .select({
          id: folders.id,
          name: folders.name,
          visibility: folders.visibility,
        })
        .from(folders)
        .where(whereConditions)
        .limit(itemsPerPage)
        .offset(pageNumber * itemsPerPage);

      return c.json(result);
    },
  )
  .post(
    "/",
    validator("json", async (value, c) => {
      const parsed = createFolderSchema.safeParse(value);
      if (!parsed.success) {
        throw new HTTPException(400, { message: "BAD_REQUEST" });
      }
      return parsed.data;
    }),
    async (c) => {
      const { values } = c.req.valid("json");
      const user = c.get("user");

      // Encrypt password if provided
      const encryptedKey =
        values.visibility === "protected" && values.password
          ? await encryptApiKey(values.password, process.env.ENCRYPTION_KEY!)
          : undefined;

      // Insert the folder
      const [insertedFolder] = await db()
        .insert(folders)
        .values({
          name: values.name,
          owner: user.id,
          description: values.description,
          visibility: values.visibility,
          encryptedKey,
        })
        .returning({ id: folders.id });

      // If the folder is protected, add the creator as a member
      if (values.visibility === "protected") {
        await db().insert(folderUsers).values({
          folderId: insertedFolder.id,
          userId: user.id,
        });
      }

      return c.json({ message: "Folder created" });
    },
  );

export default app;
