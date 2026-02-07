import { db } from "@workspace/server/drizzle/db.js";
import { courses } from "@workspace/server/drizzle/schema/schema.js";
import { eq } from "drizzle-orm";

export async function deleteCourse({ courseId }: { courseId: string }) {
  const deletedCourses = await db
    .delete(courses)
    .where(eq(courses.id, courseId))
    .returning({ name: courses.name });

  return deletedCourses[0]?.name;
}
