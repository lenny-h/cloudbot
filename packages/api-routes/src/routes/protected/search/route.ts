import * as z from "zod";

import { documentSearchPrompt } from "@workspace/api-routes/providers/prompts.js";
import { type Bindings } from "@workspace/api-routes/types/bindings.js";
import { type Variables } from "@workspace/api-routes/types/variables.js";
import { buildMetadataFilter } from "@workspace/api-routes/utils/build-metadata-filter.js";
import { type FileMetadata } from "@workspace/api-routes/utils/filter-authorized-files.js";
import {
  filterAuthorizedFolders,
  type FolderMetadata,
} from "@workspace/api-routes/utils/filter-authorized-folders.js";
import { db } from "@workspace/server/drizzle/db.js";
import { folders } from "@workspace/server/drizzle/schema.js";
import { inArray } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const searchBodySchema = z
  .object({
    query: z.string().min(1).max(300),
    folderIds: z.array(z.uuid()).min(1).max(20),
    max_num_results: z.number().min(2).max(10).default(6),
  })
  .strict();

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>().post(
  "/",
  validator("json", (value, c) => {
    const parsed = searchBodySchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }
    return parsed.data;
  }),
  async (c) => {
    const { query, folderIds, max_num_results } = c.req.valid("json");
    const user = c.get("user");

    // Verify user has access to the requested folders
    const requestedFolders = await db()
      .select({
        id: folders.id,
        visibility: folders.visibility,
        folderId: folders.id,
        owner: folders.owner,
      })
      .from(folders)
      .where(inArray(folders.id, folderIds));

    const authorizedFolders = await filterAuthorizedFolders(
      requestedFolders,
      user.id,
    );

    if (authorizedFolders.length !== folderIds.length) {
      throw new HTTPException(403, {
        message: "You do not have permission to access one or more folders",
      });
    }

    const folderMetadata: FolderMetadata[] = authorizedFolders;
    const fileMetadata: FileMetadata[] = [];

    const metadataFilter = buildMetadataFilter(
      user.id,
      fileMetadata,
      folderMetadata,
    );

    const answer = await c.env.AI.autorag("autorag").aiSearch({
      system_prompt: documentSearchPrompt,
      query,
      rewrite_query: false,
      max_num_results,
      ranking_options: {
        score_threshold: 0.3,
      },
      reranking: {
        enabled: true,
        model: "@cf/baai/bge-reranker-base",
      },
      stream: false,
      ...(metadataFilter && { filters: metadataFilter }),
    });

    const sources = answer.data.map((source) => ({
      fileId: source.file_id,
      filename: source.filename,
      mediaType: source.filename.split(".").pop() || "unknown",
      score: source.score,
    }));

    return c.json({
      response: answer.response,
      sources,
    });
  },
);

export default app;
