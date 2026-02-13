"use client";

import { useWebTranslations } from "@/contexts/web-translations";
import { useFolderDropzone } from "@/hooks/use-folder-dropzone";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { useInfiniteQueryWithRPC } from "@workspace/ui/hooks/use-infinite-query";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { cn } from "@workspace/ui/lib/utils";
import {
  Check,
  ChevronLeft,
  Globe,
  Loader2,
  Lock,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { memo, useState } from "react";
import { UploadList } from "./upload-list";

interface Folder {
  id: string;
  name: string;
  visibility: "private" | "protected" | "public";
}

const visibilityIcon = {
  private: Lock,
  public: Globe,
  protected: ShieldCheck,
};

const visibilityColor = {
  private: "text-orange-500",
  public: "text-green-500",
  protected: "text-blue-500",
};

export const UploadFileDialog = memo(() => {
  const { sharedT } = useSharedTranslations();
  const { webT } = useWebTranslations();
  const [open, setOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);

  const {
    data: folders,
    isPending,
    error,
    inViewRef,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQueryWithRPC({
    queryKey: ["upload-folders"],
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
    enabled: open,
  });

  const handleClose = () => {
    setOpen(false);
    setSelectedFolder(null);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="size-4" />
          {webT.uploadFileDialog.uploadFiles}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {selectedFolder
              ? webT.uploadFileDialog.uploadTo.replace(
                  "{folderName}",
                  selectedFolder.name,
                )
              : webT.uploadFileDialog.selectFolder}
          </DialogTitle>
          <DialogDescription>
            {selectedFolder
              ? webT.uploadFileDialog.uploadDescription
              : webT.uploadFileDialog.selectFolderDescription}
          </DialogDescription>
        </DialogHeader>

        {selectedFolder ? (
          <UploadSection
            folder={selectedFolder}
            onBack={() => setSelectedFolder(null)}
          />
        ) : (
          <FolderPickerList
            folders={folders}
            isPending={isPending}
            error={error}
            selectedFolder={selectedFolder}
            onSelectFolder={setSelectedFolder}
            inViewRef={inViewRef}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
          />
        )}
      </DialogContent>
    </Dialog>
  );
});

const FolderPickerList = memo(
  ({
    folders,
    isPending,
    error,
    selectedFolder,
    onSelectFolder,
    inViewRef,
    hasNextPage,
    isFetchingNextPage,
  }: {
    folders: Folder[] | undefined;
    isPending: boolean;
    error: Error | null;
    selectedFolder: Folder | null;
    onSelectFolder: (folder: Folder) => void;
    inViewRef: (node?: Element | null) => void;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
  }) => {
    const { webT } = useWebTranslations();

    if (isPending) {
      return (
        <div className="h-64 space-y-1 overflow-y-auto pr-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton
              key={index}
              className="bg-muted/50 flex h-12 rounded-lg border p-3"
            />
          ))}
        </div>
      );
    }

    if (error || !folders) {
      return (
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground text-sm">
            {webT.uploadFileDialog.errorLoadingFolders}
          </p>
        </div>
      );
    }

    if (folders.length === 0) {
      return (
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground text-sm">
            {webT.uploadFileDialog.noFolders}
          </p>
        </div>
      );
    }

    return (
      <div className="h-64 space-y-1 overflow-y-auto pr-1">
        {folders.map((folder) => {
          const Icon = visibilityIcon[folder.visibility];
          return (
            <div
              key={folder.id}
              className={cn(
                "hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                selectedFolder?.id === folder.id && "bg-muted",
              )}
              onClick={() => onSelectFolder(folder)}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0",
                  visibilityColor[folder.visibility],
                )}
              />
              <span className="flex-1 truncate font-medium">
                {folder.name}
              </span>
              <span className="text-muted-foreground text-xs capitalize">
                {folder.visibility}
              </span>
              {selectedFolder?.id === folder.id && (
                <Check className="size-4 text-green-500" />
              )}
            </div>
          );
        })}
        {hasNextPage && (
          <div ref={inViewRef} className="flex h-8 items-center justify-center">
            {isFetchingNextPage && (
              <Loader2 className="size-4 animate-spin" />
            )}
          </div>
        )}
      </div>
    );
  },
);

const UploadSection = memo(
  ({
    folder,
    onBack,
  }: {
    folder: Folder;
    onBack: () => void;
  }) => {
    const { webT } = useWebTranslations();
    const { getRootProps, getInputProps, isDragActive, uploads } =
      useFolderDropzone({ folderId: folder.id });

    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={onBack}
        >
          <ChevronLeft className="size-4" />
          {webT.uploadFileDialog.backToFolders}
        </Button>

        <div
          {...getRootProps()}
          className={cn(
            "flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          )}
        >
          <input {...getInputProps()} />
          <Upload
            className={cn(
              "size-8",
              isDragActive ? "text-primary" : "text-muted-foreground",
            )}
          />
          {isDragActive ? (
            <p className="text-primary text-sm font-medium">
              {webT.uploadFileDialog.dropFiles}
            </p>
          ) : (
            <div className="text-center">
              <p className="text-sm font-medium">
                {webT.uploadFileDialog.dragAndDrop}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {webT.uploadFileDialog.maxFileSize}
              </p>
            </div>
          )}
        </div>

        {Object.keys(uploads).length > 0 && <UploadList uploads={uploads} />}
      </div>
    );
  },
);
