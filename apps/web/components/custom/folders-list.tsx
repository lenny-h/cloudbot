import { useFilter } from "@/contexts/filter-context";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { memo, useCallback } from "react";
import { toast } from "sonner";
import { FilterableList, ListItem } from "./filterable-list";

interface Props {
  open: boolean;
  inputValue: string;
  max: number;
  onShowKeyDialog: (folder: Folder) => void;
  onAddFolderToFilter: (folder: Folder) => void;
}

interface Folder extends ListItem {
  id: string;
  name: string;
  visibility: "private" | "protected" | "public";
}

export const FoldersList = memo(
  ({ open, inputValue, max, onShowKeyDialog, onAddFolderToFilter }: Props) => {
    const { sharedT } = useSharedTranslations();
    const { filter, setFilter } = useFilter();

    const removeFolderFromFilter = useCallback(
      (folder: Folder) => {
        const newFilter = {
          ...filter,
          folders: filter.folders.filter((f) => f.id !== folder.id),
        };
        setFilter(newFilter);
      },
      [filter, setFilter],
    );

    const toggleFolder = async (item: ListItem) => {
      const folder = item as Folder;
      const folderIncluded = filter.folders
        .map((c) => c.id)
        .includes(folder.id);

      // If removing folder, just remove it
      if (folderIncluded) {
        removeFolderFromFilter(folder);
        return;
      }

      // If folder is public, just add it
      if (folder.visibility === "public") {
        onAddFolderToFilter(folder);
        return;
      }

      const cachedAccess = localStorage.getItem(`folder-access-${folder.id}`);
      if (cachedAccess !== null) {
        if (cachedAccess === "true") {
          onAddFolderToFilter(folder);
        } else {
          onShowKeyDialog(folder);
        }
        return;
      }

      // Validate folder access
      const validateAccessPromise = apiFetcher(
        (client) =>
          client.folders["validate-access"].$post({
            json: { folderId: folder.id },
          }),
        sharedT.apiCodes,
      ).then(({ hasAccess }) => {
        localStorage.setItem(`folder-access-${folder.id}`, String(hasAccess));
        if (hasAccess) {
          onAddFolderToFilter(folder);
        } else {
          onShowKeyDialog(folder);
        }
        return hasAccess;
      });

      toast.promise(validateAccessPromise, {
        loading: "Checking folder access...",
        success: (hasAccess) =>
          hasAccess ? "Folder access validated!" : "Folder key required",
        error: (error) => "Error checking folder access: " + error.message,
      });
    };

    return (
      <FilterableList
        open={open}
        inputValue={inputValue}
        queryKey={["folders"]}
        queryFn={({ pageParam }) =>
          apiFetcher(
            (client) =>
              client["folders"].$get({
                query: {
                  pageNumber: (pageParam ?? 0).toString(),
                  itemsPerPage: "10",
                },
              }),
            sharedT.apiCodes,
          )
        }
        ilikeQueryFn={(prefix) =>
          apiFetcher(
            (client) =>
              client["folders"]["ilike"].$get({
                query: {
                  prefix,
                },
              }),
            sharedT.apiCodes,
          )
        }
        selectedItems={filter.folders}
        onToggleItem={toggleFolder}
        maxItems={max}
      />
    );
  },
);
