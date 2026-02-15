import { db } from "@workspace/server/drizzle/db.js";
import { folders } from "@workspace/server/drizzle/schema.js";
import { eq } from "drizzle-orm";

export async function deleteFolder({ folderId }: { folderId: string }) {
  const deletedFolders = await db()
    .delete(folders)
    .where(eq(folders.id, folderId))
    .returning({ name: folders.name });

  return deletedFolders[0]?.name;
}
