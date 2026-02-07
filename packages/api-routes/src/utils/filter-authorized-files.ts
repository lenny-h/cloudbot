import { db } from "@workspace/server/drizzle/db.js";
import { courseUsers } from "@workspace/server/drizzle/schema/schema.js";
import { and, eq } from "drizzle-orm";

export type FileMetadata = {
  id: string;
  visibility: string;
  folderId: string;
  owner: string;
};

/**
 * Filters files based on user permissions
 * - Public files are always accessible
 * - Protected files require user to be in courseUsers
 * - Private files require user to be the owner
 */
export async function filterAuthorizedFiles(
  fileList: FileMetadata[],
  userId: string,
): Promise<FileMetadata[]> {
  const filteredFiles = await Promise.all(
    fileList.map(async (file) => {
      // Public files are always allowed
      if (file.visibility === "public") {
        return file;
      }

      // For protected files, check if user has access via courseUsers
      if (file.visibility === "protected") {
        const access = await db
          .select()
          .from(courseUsers)
          .where(
            and(
              eq(courseUsers.folderId, file.folderId),
              eq(courseUsers.userId, userId),
            ),
          )
          .limit(1);

        return access.length > 0 ? file : null;
      }

      // For private files, check if user is the folder owner
      if (file.visibility === "private" && file.owner === userId) {
        return file;
      }

      return null;
    }),
  );

  // Remove null entries (files user doesn't have access to)
  return filteredFiles.filter((file) => file !== null);
}
