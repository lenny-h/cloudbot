import { ssoClient } from "@better-auth/sso/client";
import {
  adminClient,
  inferAdditionalFields,
  lastLoginMethodClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { toast } from "sonner";

export const client = createAuthClient({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/auth`,
  plugins: [
    adminClient(),
    ssoClient(),
    twoFactorClient(),
    lastLoginMethodClient(),
    // oneTapClient({
    //   clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
    //   promptOptions: {
    //     maxAttempts: 1,
    //   },
    // }),
    inferAdditionalFields({
      user: {
        username: {
          type: "string",
          required: true,
        },
      },
    }),
  ],
  fetchOptions: {
    credentials: "include", // Required for cross-origin cookie handling
    timeout: 30000, // 30 seconds timeout
    onError(e) {
      if (e.error.status === 429) {
        toast.error("Too many requests. Please try again later.");
      }
    },
  },
});

export const { signUp, signIn, signOut, useSession, twoFactor } = client;

/**
 * Check if a user ID is in the ADMIN_USER_IDS list.
 * Reads from NEXT_PUBLIC_ADMIN_USER_IDS environment variable.
 */
export function isAdminUser(userId: string | undefined): boolean {
  if (!userId) return false;
  const adminUserIds = (process.env.NEXT_PUBLIC_ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim());
  return adminUserIds.includes(userId);
}
