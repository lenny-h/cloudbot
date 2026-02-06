import { db } from "@workspace/server/drizzle/db.js";
import { documents } from "@workspace/server/drizzle/schema/schema.js";
import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { type ArtifactKind } from "../../schemas/artifact-schema.js";

export async function getDocumentById({ id }: { id: string }) {
  const result = await db
    .select()
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1);

  if (result.length === 0) {
    throw new HTTPException(404, { message: "NOT_FOUND" });
  }
  return result[0];
}

export async function saveDocument({
  id,
  title,
  content,
  kind,
  userId,
}: {
  id: string;
  title: string;
  content: string;
  kind: ArtifactKind;
  userId: string;
}) {
  await db.insert(documents).values({
    id,
    title,
    content,
    kind,
    owner: userId,
  });
}
