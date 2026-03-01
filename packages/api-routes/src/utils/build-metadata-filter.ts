import { type FileMetadata } from "./filter-authorized-files.js";
import { type FolderMetadata } from "./filter-authorized-folders.js";

type ComparisonFilter = {
  type: "eq" | "ne" | "gt" | "gte" | "lt" | "lte";
  key: string;
  value: string;
};

type CompoundFilter = {
  type: "and" | "or";
  filters: ComparisonFilter[];
};

type MetadataFilter = ComparisonFilter | CompoundFilter;

export function buildMetadataFilter(
  userId: string,
  fileMetadata: FileMetadata[],
  folderMetadata: FolderMetadata[],
): MetadataFilter | undefined {
  // If there are files, filter by filenames only
  if (fileMetadata.length > 0) {
    const filenames = fileMetadata.map((f) => {
      if (f.visibility === "private") {
        return `${userId}/${f.folderId}/${f.name}`;
      }
      return `${f.visibility}/${f.folderId}/${f.name}`;
    });

    // Single file - use simple eq filter
    if (filenames.length === 1) {
      return {
        type: "eq",
        key: "filename",
        value: filenames[0],
      };
    }

    // Multiple files - use or compound filter with eq operators
    return {
      type: "or",
      filters: filenames.map((name) => ({
        type: "eq",
        key: "filename",
        value: name,
      })),
    };
  }

  // If no files but there are folders, filter by folders
  if (folderMetadata.length > 0) {
    const folderPaths = folderMetadata.map((f) => `${f.visibility}/${f.id}`);

    // Single folder - use "starts with" filter pattern
    if (folderPaths.length === 1) {
      return {
        type: "eq",
        key: "folder",
        value: folderPaths[0],
      };
    }

    // Multiple folders - use or with multiple "starts with" patterns
    // Note: This creates separate "starts with" filters for each folder,
    // then combines them with OR logic
    return {
      type: "or",
      filters: folderPaths.flatMap((folderPath) => [
        {
          type: "eq",
          key: "folder",
          value: folderPath,
        },
      ]),
    };
  }

  // No files or folders provided
  return undefined;
}
