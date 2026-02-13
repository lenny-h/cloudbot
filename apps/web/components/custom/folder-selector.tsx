"use client";

import { useFilter } from "@/contexts/filter-context";
import { useWebTranslations } from "@/contexts/web-translations";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { memo, useCallback, useEffect, useState } from "react";
import { FolderKeyDialog } from "./folder-key-dialog";
import { FoldersList } from "./folders-list";
import { SearchWithSelection } from "./search-with-selection";

interface SelectedFolderType {
  id: string;
  name: string;
  visibility: "private" | "protected" | "public";
}

export const FolderSelector = memo(() => {
  const { filter, setFilter } = useFilter();
  const { webT } = useWebTranslations();

  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] =
    useState<SelectedFolderType | null>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "b" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  const addFolderToFilter = useCallback(
    (folder: SelectedFolderType) => {
      const newFilter = {
        ...filter,
        folders: [...filter.folders, folder],
      };
      setFilter(newFilter);
      localStorage.setItem(`folder-access-${folder.id}`, "true");
    },
    [filter, setFilter],
  );

  const handleKeyDialogSuccess = useCallback(() => {
    if (selectedFolder) {
      addFolderToFilter(selectedFolder);
    }
    setSelectedFolder(null);
    setKeyDialogOpen(false);
  }, [selectedFolder, addFolderToFilter]);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            className="rounded-xl"
            onClick={() => setOpen((open) => !open)}
            variant="secondary"
          >
            {webT.folderSelector.foldersSelected.replace(
              "{count}",
              filter.folders.length.toString(),
            )}
            <kbd className="bg-muted text-muted-foreground inline-flex h-5 items-center gap-1 rounded-xl border px-1.5 font-mono font-medium">
              <span className="text-xs">⌘</span>b
            </kbd>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{webT.folderSelector.searchFolders}</DialogTitle>
          </DialogHeader>
          <SearchWithSelection
            type="folders"
            inputValue={inputValue}
            onInputChange={(value) => setInputValue(value)}
          />
          <FoldersList
            open={open}
            inputValue={inputValue}
            max={5}
            onShowKeyDialog={(folder) => {
              setSelectedFolder(folder);
              setOpen(false); // Close the main dialog
              setKeyDialogOpen(true);
            }}
            onAddFolderToFilter={addFolderToFilter}
          />
        </DialogContent>
      </Dialog>

      {selectedFolder && (
        <FolderKeyDialog
          open={keyDialogOpen}
          onOpenChange={setKeyDialogOpen}
          folderId={selectedFolder.id}
          folderName={selectedFolder.name}
          onSuccess={handleKeyDialogSuccess}
        />
      )}
    </>
  );
});
