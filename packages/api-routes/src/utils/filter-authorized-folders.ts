import { db } from "@workspace/server/drizzle/db.js";
import { folderUsers } from "@workspace/server/drizzle/schema.js";
import { and, eq } from "drizzle-orm";

export type FolderMetadata = {
  id: string;
  visibility: string;
  folderId: string;
  owner: string;
};

/**
 * Filters folders based on user permissions
 * - Public folders are always accessible
 * - Protected folders require user to be in folderUsers
 * - Private folders require user to be the owner
 */
export async function filterAuthorizedFolders(
  folderList: FolderMetadata[],
  userId: string,
): Promise<FolderMetadata[]> {
  const filteredFolders = await Promise.all(
    folderList.map(async (folder) => {
      // Public folders are always allowed
      if (folder.visibility === "public") {
        return folder;
      }

      // For protected folders, check if user has access via folderUsers
      if (folder.visibility === "protected") {
        const access = await db()
          .select()
          .from(folderUsers)
          .where(
            and(
              eq(folderUsers.folderId, folder.id),
              eq(folderUsers.userId, userId),
            ),
          )
          .limit(1);

        return access.length > 0 ? folder : null;
      }

      // For private folders, check if user is the owner
      if (folder.visibility === "private" && folder.owner === userId) {
        return folder;
      }

      return null;
    }),
  );

  // Remove null entries (folders user doesn't have access to)
  return filteredFolders.filter((folder) => folder !== null);
}
