import { auth } from "@/lib/auth";
import { db } from "@workspace/server/drizzle/db";
import { headers } from "next/headers";

export interface UserWithDetails {
  id: string;
  name: string;
  email: string;
  verified: boolean;
  banned: boolean;
  banReason?: string;
  banExpires?: Date | null;
  accounts: string[];
  lastSignIn: Date | null;
  createdAt: Date;
  avatarUrl: string;
  role?: string;
}

export interface GetUsersOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  role?: string;
  status?: string;
  email?: string;
  name?: string;
}

export async function getUsers(
  options: GetUsersOptions = {},
): Promise<{ users: UserWithDetails[]; total: number }> {
  // Build query for Better Auth
  const query: Record<string, any> = {
    limit: options.limit ?? 10,
    offset: options.offset ?? 0,
  };

  // Sorting
  if (options.sortBy) query.sortBy = options.sortBy;
  if (options.sortDirection) query.sortDirection = options.sortDirection;

  // Filtering by role
  if (options.role) {
    query.filterField = "role";
    query.filterOperator = "eq";
    query.filterValue = options.role;
  }

  // Filtering by status (active/banned)
  if (options.status) {
    query.filterField = "banned";
    query.filterOperator = "eq";
    query.filterValue = options.status === "banned" ? true : false;
  }

  // Filtering by email
  if (options.email) {
    query.searchField = "email";
    query.searchOperator = "contains";
    query.searchValue = options.email;
  }

  // Filtering by name
  if (options.name) {
    query.searchField = "name";
    query.searchOperator = "contains";
    query.searchValue = options.name;
  }

  // Get users from Better Auth
  const result = await auth.api.listUsers({
    headers: await headers(),
    query,
  });

  if (!result.users) {
    return { users: [], total: 0 };
  }

  // Query separate tables to get accounts information
  const accountsQuery = await db.query.account.findMany({
    columns: {
      userId: true,
      providerId: true,
    },
  });

  // Query session information
  const sessionsQuery = await db.query.session.findMany({
    columns: {
      userId: true,
      createdAt: true,
    },
    orderBy: (session) => [session.createdAt],
  });

  // Group accounts by user ID
  const accountsByUser = accountsQuery.reduce(
    (acc, account) => {
      if (!acc[account.userId]) {
        acc[account.userId] = [];
      }
      acc[account.userId].push(account.providerId);
      return acc;
    },
    {} as Record<string, string[]>,
  );

  // Get last sign in date by user ID
  const lastSignInByUser = sessionsQuery.reduce(
    (acc, session) => {
      if (!acc[session.userId] || session.createdAt > acc[session.userId]) {
        acc[session.userId] = session.createdAt;
      }
      return acc;
    },
    {} as Record<string, Date>,
  );

  // Transform the raw data into the format expected by the UsersTable component
  const users: UserWithDetails[] = result.users.map((user) => {
    const accounts = accountsByUser[user.id] || [];
    const banned = user.banned ?? false;
    const banReason = user.banReason || "";
    const banExpires = user.banExpires || null;
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
      createdAt: user.createdAt,
      avatarUrl: user.image || "",
    };
  });

  return { users, total: result.total ?? users.length };
}
