"use client";

import { useWebTranslations } from "@/contexts/web-translations";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { useInfiniteQueryWithRPC } from "@workspace/ui/hooks/use-infinite-query";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { cn } from "@workspace/ui/lib/utils";
import {
  FolderOpen,
  Globe,
  Loader2,
  Lock,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { memo, useState } from "react";
import { CreateFolderDialog } from "./create-folder-dialog";
import { DeleteForm } from "./delete-form";
import { UploadFileDialog } from "./upload-file-dialog";

interface Folder {
  id: string;
  name: string;
  visibility: "private" | "protected" | "public";
}

const visibilityConfig = {
  private: {
    icon: Lock,
    color: "text-orange-500",
    badgeClass:
      "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  },
  public: {
    icon: Globe,
    color: "text-green-500",
    badgeClass:
      "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  },
  protected: {
    icon: ShieldCheck,
    color: "text-blue-500",
    badgeClass:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
};

export const FoldersPage = memo(() => {
  const { sharedT } = useSharedTranslations();
  const { webT } = useWebTranslations();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);

  const {
    data: folders,
    isPending,
    error,
    inViewRef,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQueryWithRPC({
    queryKey: ["folders"],
    queryFn: ({ pageParam }) =>
      apiFetcher(
        (client) =>
          client.folders.$get({
            query: {
              pageNumber: (pageParam ?? 0).toString(),
              itemsPerPage: "20",
            },
          }),
        sharedT.apiCodes,
      ),
  });

  const confirmDelete = (folder: Folder) => {
    setFolderToDelete(folder);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!folderToDelete) return;
    setDeletingId(folderToDelete.id);
    setDeleteDialogOpen(false);

    try {
      await apiFetcher(
        (client) =>
          client.folders[":folderId"].$delete({
            param: { folderId: folderToDelete.id },
          }),
        sharedT.apiCodes,
      );
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    } finally {
      setDeletingId(null);
      setFolderToDelete(null);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 md:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {webT.foldersPage.title}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {webT.foldersPage.subtitle}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <UploadFileDialog />
          <CreateFolderDialog />
        </div>
      </div>

      {isPending ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="bg-muted/50 h-16 rounded-lg border" />
          ))}
        </div>
      ) : error || !folders ? (
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground text-sm">
            {webT.foldersPage.errorLoading}
          </p>
        </div>
      ) : folders.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed">
          <FolderOpen className="text-muted-foreground size-10" />
          <div className="text-center">
            <p className="font-medium">{webT.foldersPage.noFolders}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {webT.foldersPage.noFoldersDescription}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-2">
          {folders.map((folder) => {
            const config = visibilityConfig[folder.visibility];
            const Icon = config.icon;
            return (
              <div
                key={folder.id}
                className="hover:bg-muted/30 group flex items-center gap-3 rounded-lg border p-3 transition-colors"
              >
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-md border",
                    config.badgeClass,
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="truncate font-medium">{folder.name}</h3>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "shrink-0 text-xs capitalize",
                    config.badgeClass,
                  )}
                >
                  {folder.visibility}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => confirmDelete(folder)}
                  disabled={deletingId === folder.id}
                >
                  {deletingId === folder.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </Button>
              </div>
            );
          })}
          {hasNextPage && (
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

      <DeleteForm
        deleteDialogOpen={deleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        onDelete={handleDelete}
        type="folder"
      />
    </div>
  );
});
