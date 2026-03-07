import * as z from "zod";

import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { type Bindings } from "@workspace/api-routes/types/bindings.js";
import { type Variables } from "@workspace/api-routes/types/variables.js";
import { db } from "@workspace/server/drizzle/db.js";
import { files } from "@workspace/server/drizzle/schema.js";
import { createLogger } from "@workspace/server/logger/logger.js";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const logger = createLogger("confirm-upload");

const paramSchema = z.object({ fileId: uuidSchema }).strict();

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>().post(
  "/",
  validator("param", (value) => {
    const parsed = paramSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }
    return parsed.data;
  }),
  async (c) => {
    const { fileId } = c.req.valid("param");
    const user = c.get("user");

    const result = await db()
      .update(files)
      .set({ uploadConfirmed: true })
      .where(
        and(
          eq(files.id, fileId),
          eq(files.owner, user.id),
          eq(files.uploadConfirmed, false),
        ),
      )
      .returning({ id: files.id });

    if (result.length === 0) {
      logger.warn("Confirm upload failed — file not found or not pending:", {
        fileId,
        userId: user.id,
      });
      throw new HTTPException(404, { message: "NOT_FOUND" });
    }

    logger.debug("Upload confirmed:", { fileId });

    return c.json({ success: true });
  },
);

export default app;
