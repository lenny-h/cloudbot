import { db } from "@workspace/server/drizzle/db.js";
import { courseUsers } from "@workspace/server/drizzle/schema.js";
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
 * - Protected folders require user to be in courseUsers
 * - Private folders require user to be the owner
 */
export async function filterAuthorizedCourses(
  courseList: FolderMetadata[],
  userId: string,
): Promise<FolderMetadata[]> {
  const filteredCourses = await Promise.all(
    courseList.map(async (folder) => {
      // Public folders are always allowed
      if (folder.visibility === "public") {
        return folder;
      }

      // For protected folders, check if user has access via courseUsers
      if (folder.visibility === "protected") {
        const access = await db()
          .select()
          .from(courseUsers)
          .where(
            and(
              eq(courseUsers.folderId, folder.id),
              eq(courseUsers.userId, userId),
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
  return filteredCourses.filter((folder) => folder !== null);
}
