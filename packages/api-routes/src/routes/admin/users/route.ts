/**
 * MIT License
 *
 * Copyright (c) 2025 Zexa Technologies
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * Modifications copyright (C) 2026 <Lennart Horn>
 */

import * as z from "zod";

import { itemsPerPageSchema } from "@workspace/api-routes/schemas/items-per-page-schema.js";
import { pageNumberSchema } from "@workspace/api-routes/schemas/page-number-schema.js";
import { type Bindings } from "@workspace/api-routes/types/bindings.js";
import { type UserWithDetails } from "@workspace/api-routes/types/user-with-details";
import { type Variables } from "@workspace/api-routes/types/variables.js";
import { auth } from "@workspace/server/auth-server.js";
import { db } from "@workspace/server/drizzle/db.js";
import { accounts, sessions } from "@workspace/server/drizzle/schema.js";
import { desc } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const querySchema = z
  .object({
    page: pageNumberSchema.optional(),
    limit: itemsPerPageSchema.optional(),
    sortBy: z.string().optional(),
    sortDirection: z.enum(["asc", "desc"]).optional(),
    role: z.string().optional(),
    status: z.enum(["banned", "active"]).optional(),
    email: z.string().optional(),
    name: z.string().optional(),
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
    const {
      page = 1,
      limit = 10,
      sortBy,
      sortDirection,
      role,
      status,
      email,
      name,
    } = c.req.valid("query");

    const offset = (page - 1) * limit;

    // Build query for Better Auth
    const query: Record<string, any> = {
      limit,
      offset,
    };

    if (sortBy) query.sortBy = sortBy;
    if (sortDirection) query.sortDirection = sortDirection;

    if (role) {
      query.filterField = "role";
      query.filterOperator = "eq";
      query.filterValue = role;
    }

    if (status) {
      query.filterField = "banned";
      query.filterOperator = "eq";
      query.filterValue = status === "banned" ? true : false;
    }

    if (email) {
      query.searchField = "email";
      query.searchOperator = "contains";
      query.searchValue = email;
    }

    if (name) {
      query.searchField = "name";
      query.searchOperator = "contains";
      query.searchValue = name;
    }

    // Get users from Better Auth
    const result = await auth().api.listUsers({
      headers: c.req.raw.headers,
      query,
    });

    if (!result.users) {
      return c.json({ users: [], total: 0, page, limit, totalPages: 0 });
    }

    // Query separate tables to get accounts information
    const accountsQuery = await db()
      .select({
        userId: accounts.userId,
        providerId: accounts.providerId,
      })
      .from(accounts);

    // Query session information
    const sessionsQuery = await db()
      .select({
        userId: sessions.userId,
        createdAt: sessions.createdAt,
      })
      .from(sessions)
      .orderBy(desc(sessions.createdAt));

    // Group accounts by user ID
    const accountsByUser = accountsQuery.reduce(
      (acc, acct) => {
        if (!acc[acct.userId]) {
          acc[acct.userId] = [];
        }
        acc[acct.userId].push(acct.providerId);
        return acc;
      },
      {} as Record<string, string[]>,
    );

    // Get last sign in date by user ID
    const lastSignInByUser = sessionsQuery.reduce(
      (acc, sess) => {
        if (!acc[sess.userId] || sess.createdAt > acc[sess.userId]) {
          acc[sess.userId] = sess.createdAt;
        }
        return acc;
      },
      {} as Record<string, Date>,
    );

    // Transform the raw data to UserWithDetails type
    const users: UserWithDetails[] = result.users.map((user) => {
      const accounts = accountsByUser[user.id] || [];
      const banned = user.banned ?? false;
      const banReason = user.banReason || undefined;
      const banExpires = user.banExpires ? new Date(user.banExpires) : null;
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        verified: user.emailVerified,
        role: user.role,
        banned,
        banReason,
        banExpires,
        accounts,
        lastSignIn: lastSignInByUser[user.id] || null,
        createdAt: new Date(user.createdAt),
        avatarUrl: user.image || "",
      };
    });

    const total = result.total ?? users.length;

    return c.json({
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  },
);

export default app;
