import { db } from "@workspace/server/drizzle/db.js";
import { folders } from "@workspace/server/drizzle/schema.js";
import { eq } from "drizzle-orm";

export async function deleteCourse({ folderId }: { folderId: string }) {
  const deletedCourses = await db
    .delete(folders)
    .where(eq(folders.id, folderId))
    .returning({ name: folders.name });

  return deletedCourses[0]?.name;
}
