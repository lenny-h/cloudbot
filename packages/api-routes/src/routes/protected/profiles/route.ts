import { type Bindings } from "@workspace/api-routes/types/bindings.js";
import { type Variables } from "@workspace/api-routes/types/variables.js";
import { db } from "@workspace/server/drizzle/db.js";
import { users as profiles } from "@workspace/server/drizzle/schema.js";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { updateProfileSchema } from "./schema.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()
  .get("/", async (c) => {
    const user = c.get("user");

    const result = await db()
      .select({
        name: profiles.name,
        username: profiles.username,
      })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (result.length === 0) {
      return c.json(undefined);
    }

    return c.json(result[0]);
  })
  .patch(
    "/",
    validator("json", async (value, c) => {
      const parsed = updateProfileSchema.safeParse(value);
      if (!parsed.success) {
        throw new HTTPException(400, { message: "BAD_REQUEST" });
      }
      return parsed.data;
    }),
    async (c) => {
      const { name, username } = c.req.valid("json");
      const user = c.get("user");

      await db()
        .update(profiles)
        .set({
          name,
          username,
        })
        .where(eq(profiles.id, user.id));

      return c.json({ message: "Profile updated" });
    },
  );

export default app;
