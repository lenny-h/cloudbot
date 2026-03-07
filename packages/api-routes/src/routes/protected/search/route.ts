import * as z from "zod";

import { searchModelIdx } from "@workspace/api-routes/providers/models.js";
import { documentSearchPrompt } from "@workspace/api-routes/providers/prompts.js";
import { getModel } from "@workspace/api-routes/providers/providers.js";
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
import { createLogger } from "@workspace/server/logger/logger.js";
import { generateText } from "ai";
import { inArray } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const logger = createLogger("search-route");

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

    logger.debug("Constructed the following metadata filter for search:", {
      metadataFilter,
    });

    const searchResult = await c.env.AI.autorag(
      process.env.AUTORAG_NAME ?? "",
    ).search({
      query,
      max_num_results,
      ranking_options: {
        score_threshold: 0.1,
      },
      reranking: {
        enabled: true,
        model: "@cf/baai/bge-reranker-base",
      },
      ...(metadataFilter && { filters: metadataFilter }),
    });

    logger.debug(
      `Found ${searchResult.data.length} results for query: "${query}"`,
    );

    if (searchResult.data.length === 0) {
      throw new HTTPException(404, { message: "NO_RESULTS" });
    }

    const sources = searchResult.data.map((item) => {
      const parts = item.filename.split("/");
      const filename = parts[parts.length - 1] ?? item.filename;
      return {
        folderId: parts[parts.length - 2] ?? "",
        filename,
        mediaType: filename.split(".").pop() || "unknown",
        score: item.score,
      };
    });

    const context = searchResult.data
      .map((item, i) => {
        const { folderId, filename } = sources[i]!;
        return `[${folderId}/${filename}]\n${item.content}`;
      })
      .join("\n\n");

    const config = await getModel(c.env, searchModelIdx);
    const { text } = await generateText({
      model: config.model,
      system: documentSearchPrompt,
      prompt: `Query: ${query}\n\nSources:\n${context}`,
    });

    return c.json({
      response: text,
      sources,
    });
  },
);

export default app;
