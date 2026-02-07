import * as z from "zod";

import { deleteCourse } from "@workspace/api-routes/lib/queries/courses.js";
import { StorageClient } from "@workspace/api-routes/lib/storage-client.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { type Bindings } from "@workspace/api-routes/types/bindings.js";
import { type Variables } from "@workspace/api-routes/types/variables.js";
import { db } from "@workspace/server/drizzle/db.js";
import { courses, files } from "@workspace/server/drizzle/schema/schema.js";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const paramSchema = z.object({ courseId: uuidSchema }).strict();

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>().delete(
  "/",
  validator("param", (value, c) => {
    const parsed = paramSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }
    return parsed.data;
  }),
  async (c) => {
    const { courseId } = c.req.valid("param");
    const user = c.get("user");

    const result = await db
      .select({
        visibility: courses.visibility,
      })
      .from(courses)
      .where(and(eq(courses.id, courseId), eq(courses.owner, user.id)))
      .limit(1);

    const course = result[0];
    if (!course) {
      throw new HTTPException(404, { message: "NOT_FOUND" });
    }

    const courseFiles = await db
      .select({
        id: files.id,
        visibility: files.visibility,
        name: files.name,
      })
      .from(files)
      .where(eq(files.courseId, courseId));

    if (courseFiles.length === 0) {
      const deletedCourseName = await deleteCourse({ courseId });

      if (!deletedCourseName) {
        throw new HTTPException(404, { message: "NOT_FOUND" });
      }

      return c.json({ name: deletedCourseName });
    }

    const storageClient = new StorageClient(c.env.YOUR_BUCKET);

    for (const file of courseFiles) {
      await db.delete(files).where(eq(files.id, file.id));

      const key =
        file.visibility === "private"
          ? `${user.id}/${courseId}/${file.name}`
          : `${file.visibility}/${courseId}/${file.name}`;

      await storageClient.deleteFile({
        key,
      });
    }

    const deletedCourseName = await deleteCourse({ courseId });

    if (!deletedCourseName) {
      throw new HTTPException(404, { message: "NOT_FOUND" });
    }

    return c.json({ name: deletedCourseName });
  },
);

export default app;
