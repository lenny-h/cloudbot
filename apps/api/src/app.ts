import { protectedApiRouter } from "@workspace/api-routes/routes/protected/index.js";
import { unprotectedApiRouter } from "@workspace/api-routes/routes/unprotected/index.js";
import { auth } from "@workspace/server/auth-server.js";
import { conditionalLogger } from "@workspace/server/logger/conditional-logger.js";
import { authMiddleware } from "@workspace/server/middleware/auth-middleware.js";
import { errorHandler } from "@workspace/server/middleware/error-handler.js";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";

const app = new Hono()
  .use("*", requestId())
  .use("*", compress())
  .use("*", secureHeaders())

  .use("*", conditionalLogger)

  // CORS middleware
  .use(
    "*",
    cors({
      origin: process.env.ALLOWED_ORIGINS!.split(","),
      credentials: true,
    }),
  )

  // Global error handler
  .use("*", errorHandler)

  // Default root route
  .get("/", (c) => {
    return c.json({
      name: "NextGPT API",
      version: "1.0.0",
      status: "Running",
    });
  })

  // Authentication routes
  .on(["POST", "GET"], "/api/auth/*", (c) => {
    return auth.handler(c.req.raw);
  })

  // Authentication middleware for protected routes
  .use("/api/protected/*", authMiddleware)

  // Unprotected routes
  .route("/api/public", unprotectedApiRouter)

  // Protected routes
  .route("/api/protected", protectedApiRouter);

export default app;

export type ApiAppType = typeof app;
