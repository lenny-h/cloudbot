"use client";

import { usePdf } from "@/contexts/pdf-context";
import { useRefs } from "@/contexts/refs-context";
import { useWebTranslations } from "@/contexts/web-translations";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { SidebarTrigger } from "@workspace/ui/components/sidebar-left";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { useInfiniteQueryWithRPC } from "@workspace/ui/hooks/use-infinite-query";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { cn } from "@workspace/ui/lib/utils";
import {
  AlertTriangle,
  Download,
  Eye,
  File,
  FolderOpen,
  Loader2,
  Search,
  Trash2,
} from "lucide-react";
import { memo, useEffect, useState } from "react";
import { toast } from "sonner";
import { FolderCombobox } from "./folder-combobox";

interface Folder {
  id: string;
  name: string;
  visibility: "private" | "protected" | "public";
}

interface FileItem {
  id: string;
  name: string;
  folderId: string;
  visibility: string;
  uploadConfirmed: boolean;
  owner: string;
  size: number;
  format: string;
  createdAt: string;
}

export const FilesPage = memo(() => {
  const { sharedT, locale } = useSharedTranslations();
  const { webT } = useWebTranslations();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { panelRef } = useRefs();
  const { openPdf } = usePdf();

  const [selectedFolders, setSelectedFolders] = useState<Folder[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [ilikeResults, setIlikeResults] = useState<FileItem[] | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const selectedFolderIds = selectedFolders.map((f) => f.id);

  // Load files from selected folders
  const {
    data: files,
    isPending: filesPending,
    error: filesError,
    inViewRef,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQueryWithRPC({
    queryKey: ["folder-files", ...selectedFolderIds],
    queryFn: ({ pageParam }) =>
      apiFetcher(
        (client) =>
          client.files.$get({
            query: {
              folderIds: selectedFolderIds.join(","),
              pageNumber: (pageParam ?? 0).toString(),
              itemsPerPage: "20",
            },
          }),
        sharedT.apiCodes,
      ),
    enabled: selectedFolderIds.length > 0,
  });

  // Debounced ilike search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchValue.trim().length > 1 && selectedFolderIds.length > 0) {
        apiFetcher(
          (client) =>
            client.files.ilike.$get({
              query: {
                prefix: searchValue.trim(),
                folderIds: selectedFolderIds.join(","),
              },
            }),
          sharedT.apiCodes,
        ).then((results) => setIlikeResults(results as unknown as FileItem[]));
      } else {
        setIlikeResults(null);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [searchValue, selectedFolderIds, sharedT.apiCodes]);

  const displayFiles = (ilikeResults ?? files) as FileItem[] | undefined;

  const handleSetSelectedFolders = (folders: Folder[]) => {
    setSelectedFolders(folders);
    setIlikeResults(null);
  };

  const handleViewPdf = (file: FileItem) => {
    openPdf(isMobile, panelRef, file.folderId, file.name);
  };

  const handleDownload = async (file: FileItem) => {
    try {
      const { signedUrl } = await apiFetcher(
        (client) =>
          client.files["get-signed-url"][":folderId"][":filename"].$get({
            param: { folderId: file.folderId, filename: file.name },
          }),
        sharedT.apiCodes,
      );
      window.open(signedUrl, "_blank");
    } catch {
      toast.error(webT.filesPage.failedToDelete);
    }
  };

  const handleDeleteFile = async (file: FileItem) => {
    setDeletingId(file.id);

    const deletePromise = apiFetcher(
      (client) =>
        client.files[":fileId"].$delete({
          param: { fileId: file.id },
        }),
      sharedT.apiCodes,
    )
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["folder-files"] });
      })
      .finally(() => {
        setDeletingId(null);
      });

    toast.promise(deletePromise, {
      loading: webT.filesPage.deleting,
      success: webT.filesPage.deleted,
      error: (err) => (err as Error).message || webT.filesPage.failedToDelete,
    });
  };

  const isPdf = (file: FileItem) =>
    file.format === "application/pdf" || file.name?.endsWith(".pdf");

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
        <SidebarTrigger />
      </header>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 md:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {webT.filesPage.title}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {webT.filesPage.subtitle}
            </p>
          </div>
        </div>

        {/* Folder selection */}
        <div className="space-y-2">
          <p className="text-sm font-medium">{webT.filesPage.selectFolders}</p>
          <FolderCombobox
            selectedFolders={selectedFolders}
            onSelectedFoldersChange={handleSetSelectedFolders}
          />
        </div>

        {/* Search */}
        {selectedFolderIds.length > 0 && (
          <div className="relative">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
            <Input
              placeholder={webT.searchSelection.files}
              className="pl-8"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
        )}

        {/* File listing */}
        {selectedFolderIds.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed">
            <FolderOpen className="text-muted-foreground size-10" />
            <p className="text-muted-foreground text-sm">
              {webT.filesPage.selectFolders}
            </p>
          </div>
        ) : filesPending ? (
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                className="bg-muted/50 h-16 rounded-lg border"
              />
            ))}
          </div>
        ) : filesError || !displayFiles ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-muted-foreground text-sm">
              {webT.filesPage.errorLoading}
            </p>
          </div>
        ) : displayFiles.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed">
            <File className="text-muted-foreground size-10" />
            <div className="text-center">
              <p className="font-medium">{webT.filesPage.noFiles}</p>
              <p className="text-muted-foreground mt-1 text-sm">
                {webT.filesPage.noFilesDescription}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-2">
            {displayFiles.map((file) => (
              <div
                key={file.id}
                className={cn(
                  "hover:bg-muted/30 group flex items-center gap-3 rounded-lg border p-3 transition-colors",
                  !file.uploadConfirmed &&
                    "border-yellow-500/40 bg-yellow-500/5",
                )}
              >
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-md border",
                    !file.uploadConfirmed
                      ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                      : isPdf(file)
                        ? "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400"
                        : "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400",
                  )}
                >
                  {!file.uploadConfirmed ? (
                    <AlertTriangle className="size-4" />
                  ) : (
                    <File className="size-4" />
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-medium">{file.name}</h3>
                    {!file.uploadConfirmed && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="outline"
                            className="shrink-0 border-yellow-500/50 bg-yellow-500/10 text-xs text-yellow-600 dark:text-yellow-400"
                          >
                            {webT.filesPage.uploadPending}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{webT.filesPage.uploadPendingTooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {formatDate(file.createdAt)}
                  </p>
                </div>
                {file.format && (
                  <Badge
                    variant="outline"
                    className="hidden shrink-0 text-xs sm:inline-flex"
                  >
                    {file.format.split("/").pop()}
                  </Badge>
                )}
                <div className="flex shrink-0 items-center gap-1">
                  {file.uploadConfirmed &&
                    (isPdf(file) ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-primary opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => handleViewPdf(file)}
                        title={webT.filesPage.viewPdf}
                      >
                        <Eye className="size-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-primary opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => handleDownload(file)}
                        title={webT.filesPage.download}
                      >
                        <Download className="size-4" />
                      </Button>
                    ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => handleDeleteFile(file)}
                    disabled={deletingId === file.id}
                  >
                    {deletingId === file.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
            {!ilikeResults && hasNextPage && (
              <div
                ref={inViewRef}
                className="flex h-8 items-center justify-center"
              >
                {isFetchingNextPage && (
                  <Loader2 className="size-4 animate-spin" />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
});
