"use client";

import { useWebTranslations } from "@/contexts/web-translations";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { SidebarTrigger } from "@workspace/ui/components/sidebar-left";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { FileText, Loader2, Search, SearchX } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { toast } from "sonner";
import { FolderCombobox } from "./folder-combobox";
import { Markdown } from "./markdown";

interface Folder {
  id: string;
  name: string;
  visibility: "private" | "protected" | "public";
}

interface SearchSource {
  folderId: string;
  filename: string;
  mediaType: string;
  score: number;
}

interface SearchResult {
  response: string;
  sources: SearchSource[];
}

export const SearchPage = memo(() => {
  const { sharedT } = useSharedTranslations();
  const { webT } = useWebTranslations();

  const [selectedFolders, setSelectedFolders] = useState<Folder[]>([]);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);

  const selectedFolderIds = selectedFolders.map((f) => f.id);

  const handleSearch = useCallback(async () => {
    if (query.trim().length < 1) return;

    if (selectedFolderIds.length === 0) {
      toast.error(webT.searchPage.selectAtLeastOneFolder);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const result = await apiFetcher(
        (client) =>
          client.search.$post({
            json: {
              query: query.trim(),
              folderIds: selectedFolderIds,
              max_num_results: 6,
            },
          }),
        sharedT.apiCodes,
      );

      setSearchResult(result);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : webT.searchPage.errorSearching,
      );
      setSearchResult(null);
    } finally {
      setIsSearching(false);
    }
  }, [query, selectedFolderIds, sharedT.apiCodes, webT.searchPage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
        <SidebarTrigger />
      </header>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 md:px-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {webT.searchPage.title}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {webT.searchPage.subtitle}
          </p>
        </div>

        {/* Folder Selection */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">{webT.searchPage.selectFolders}</p>
          <FolderCombobox
            selectedFolders={selectedFolders}
            onSelectedFoldersChange={setSelectedFolders}
          />
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-2 left-2 size-4" />
            <Input
              placeholder={webT.searchPage.searchPlaceholder}
              className="pl-8"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={isSearching || query.trim().length < 1}
            className="shrink-0"
          >
            {isSearching ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Search className="mr-2 size-4" />
            )}
            {webT.searchPage.searchButton}
          </Button>
        </div>

        {/* Loading State */}
        {isSearching && (
          <div className="flex flex-col gap-3">
            <Skeleton className="bg-muted/50 h-32 rounded-lg border" />
            <Skeleton className="bg-muted/50 h-16 rounded-lg border" />
            <Skeleton className="bg-muted/50 h-16 rounded-lg border" />
          </div>
        )}

        {/* Results */}
        {!isSearching && searchResult && (
          <div className="flex flex-col gap-4">
            {/* AI Response */}
            <div className="prose prose-sm dark:prose-invert max-w-none rounded-lg border p-4">
              <Markdown
                docSources={searchResult.sources}
                parseSourceRefs={true}
              >
                {searchResult.response}
              </Markdown>
            </div>

            {/* Sources */}
            {searchResult.sources.length > 0 && (
              <div className="flex flex-col gap-2">
                <h2 className="text-sm font-medium">
                  {webT.searchPage.sources}
                </h2>
                <div className="grid gap-2">
                  {searchResult.sources.map((source) => (
                    <div
                      key={`${source.folderId}/${source.filename}`}
                      className="hover:bg-muted/30 flex items-center gap-3 rounded-lg border p-3 transition-colors"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        <FileText className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {source.filename}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {source.mediaType.toUpperCase()}
                          {source.folderId && (
                            <span className="ml-1 opacity-60">
                              · {source.folderId}
                            </span>
                          )}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="shrink-0 text-xs tabular-nums"
                      >
                        {(source.score * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!isSearching && hasSearched && !searchResult && (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed">
            <SearchX className="text-muted-foreground size-10" />
            <div className="text-center">
              <p className="font-medium">{webT.searchPage.noResults}</p>
              <p className="text-muted-foreground mt-1 text-sm">
                {webT.searchPage.noResultsDescription}
              </p>
            </div>
          </div>
        )}

        {/* Initial State */}
        {!isSearching && !hasSearched && (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed">
            <Search className="text-muted-foreground size-10" />
            <div className="text-center">
              <p className="font-medium">{webT.searchPage.title}</p>
              <p className="text-muted-foreground mt-1 text-sm">
                {webT.searchPage.subtitle}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
});
