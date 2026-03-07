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
