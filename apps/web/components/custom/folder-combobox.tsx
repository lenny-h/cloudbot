"use client";

import { useWebTranslations } from "@/contexts/web-translations";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { useInfiniteQueryWithRPC } from "@workspace/ui/hooks/use-infinite-query";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { cn } from "@workspace/ui/lib/utils";
import {
  Check,
  ChevronDown,
  Globe,
  Lock,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

interface Folder {
  id: string;
  name: string;
  visibility: "private" | "protected" | "public";
}

interface FolderComboboxProps {
  selectedFolders: Folder[];
  onSelectedFoldersChange: (folders: Folder[]) => void;
  placeholder?: string;
}

const visibilityIcons = {
  private: Lock,
  public: Globe,
  protected: ShieldCheck,
};

export const FolderCombobox = memo(
  ({
    selectedFolders,
    onSelectedFoldersChange,
    placeholder,
  }: FolderComboboxProps) => {
    const { sharedT } = useSharedTranslations();
    const { webT } = useWebTranslations();

    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { data: folders, isPending: foldersPending } =
      useInfiniteQueryWithRPC({
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

    const folderList = folders as Folder[] | undefined;

    const selectedIds = useMemo(
      () => new Set(selectedFolders.map((f) => f.id)),
      [selectedFolders],
    );

    const filtered = useMemo(() => {
      if (!folderList) return [];
      if (!search.trim()) return folderList;
      const q = search.toLowerCase();
      return folderList.filter((f) => f.name.toLowerCase().includes(q));
    }, [folderList, search]);

    const toggle = useCallback(
      (folder: Folder) => {
        const next = selectedIds.has(folder.id)
          ? selectedFolders.filter((f) => f.id !== folder.id)
          : [...selectedFolders, folder];
        onSelectedFoldersChange(next);
      },
      [selectedFolders, selectedIds, onSelectedFoldersChange],
    );

    const remove = useCallback(
      (id: string) => {
        onSelectedFoldersChange(selectedFolders.filter((f) => f.id !== id));
      },
      [selectedFolders, onSelectedFoldersChange],
    );

    // Close dropdown on outside click
    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setOpen(false);
          setSearch("");
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, []);

    if (foldersPending) {
      return <Skeleton className="h-9 w-full rounded-lg" />;
    }

    return (
      <div ref={containerRef} className="relative">
        {/* Trigger area */}
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          className={cn(
            "border-input bg-background ring-ring/10 flex min-h-9 w-full cursor-pointer flex-wrap items-center gap-1 rounded-lg border px-2 py-1 text-sm transition-colors",
            "focus-within:ring-ring/50 focus-within:ring-2",
            open && "ring-ring/50 ring-2",
          )}
        >
          {selectedFolders.map((folder) => (
            <span
              key={folder.id}
              className="bg-muted text-foreground flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium"
            >
              {folder.name}
              <span
                role="button"
                tabIndex={0}
                className="hover:text-destructive ml-0.5 cursor-pointer rounded-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(folder.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    remove(folder.id);
                  }
                }}
              >
                <X className="size-3" />
              </span>
            </span>
          ))}
          {selectedFolders.length === 0 && (
            <span className="text-muted-foreground px-1">
              {placeholder ?? webT.folderCombobox.placeholder}
            </span>
          )}
          <ChevronDown className="text-muted-foreground ml-auto size-4 shrink-0" />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="bg-popover text-popover-foreground ring-border animate-in fade-in-0 zoom-in-95 absolute z-50 mt-1 w-full rounded-lg border shadow-md ring-1">
            {/* Search input */}
            <div className="border-b p-1.5">
              <div className="relative">
                <Search className="text-muted-foreground absolute top-2 left-2 size-3.5" />
                <input
                  ref={inputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={webT.folderCombobox.placeholder}
                  className="placeholder:text-muted-foreground w-full rounded-md bg-transparent py-1.5 pr-2 pl-7 text-sm outline-none"
                />
              </div>
            </div>

            {/* Options list */}
            <div className="max-h-56 overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  {webT.folderCombobox.noFoldersFound}
                </p>
              ) : (
                filtered.map((folder) => {
                  const isSelected = selectedIds.has(folder.id);
                  const VisIcon = visibilityIcons[folder.visibility];
                  return (
                    <button
                      key={folder.id}
                      type="button"
                      onClick={() => toggle(folder)}
                      className={cn(
                        "hover:bg-accent hover:text-accent-foreground flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                        isSelected && "bg-accent/50",
                      )}
                    >
                      <div
                        className={cn(
                          "border-primary flex size-4 shrink-0 items-center justify-center rounded-sm border",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50",
                        )}
                      >
                        {isSelected && <Check className="size-3" />}
                      </div>
                      <VisIcon className="text-muted-foreground size-3.5 shrink-0" />
                      <span className="truncate">{folder.name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    );
  },
);
