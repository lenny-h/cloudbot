import { db } from "@workspace/server/drizzle/db.js";
import { diffs, documents } from "@workspace/server/drizzle/schema/schema.js";
import { and, desc, eq, inArray } from "drizzle-orm";
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

export async function saveDiff({
  id,
  documentId,
  previousText,
  newText,
  kind,
  userId,
}: {
  id: string;
  documentId: string;
  previousText: string;
  newText: string;
  kind: ArtifactKind;
  userId: string;
}) {
  await db.insert(diffs).values({
    id,
    documentId,
    previousText,
    newText,
    kind,
    owner: userId,
  });
}

/**
 * Get the latest version of each document by the given IDs.
 * Documents have a composite PK (id, createdAt), so we pick the most recent.
 */
export async function getLatestDocumentsByIds({
  ids,
  userId,
}: {
  ids: string[];
  userId: string;
}) {
  if (ids.length === 0) return [];

  const results = await db
    .select()
    .from(documents)
    .where(and(inArray(documents.id, ids), eq(documents.owner, userId)))
    .orderBy(desc(documents.createdAt));

  // Keep only the latest version per document ID
  const latestByIdMap = new Map<string, (typeof results)[number]>();
  for (const doc of results) {
    if (!latestByIdMap.has(doc.id)) {
      latestByIdMap.set(doc.id, doc);
    }
  }

  return Array.from(latestByIdMap.values());
}
