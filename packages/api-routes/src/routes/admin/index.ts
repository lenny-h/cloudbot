import { Hono } from "hono";
import usersRoute from "./users/route.js";

const adminApiRouter = new Hono().route("/users", usersRoute);

export { adminApiRouter };
export type AdminApiType = typeof adminApiRouter;
