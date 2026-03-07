"use client";

import { useWebTranslations } from "@/contexts/web-translations";
import { useViewDocument } from "@/hooks/use-view-document";
import { useQueryClient } from "@tanstack/react-query";
import { type ArtifactKind } from "@workspace/api-routes/schemas/artifact-schema";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { SidebarTrigger } from "@workspace/ui/components/sidebar-left";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { useInfiniteQueryWithRPC } from "@workspace/ui/hooks/use-infinite-query";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { cn } from "@workspace/ui/lib/utils";
import { Code, FileText, Loader2, Search, Trash2 } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { DeleteForm } from "./delete-form";

interface Document {
  id: string;
  title: string;
  content: string;
  kind: ArtifactKind;
  createdAt: string;
}

const kindConfig = {
  text: {
    icon: FileText,
    color: "text-purple-500",
    badgeClass:
      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  code: {
    icon: Code,
    color: "text-amber-500",
    badgeClass:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
};

export const DocumentsPage = memo(() => {
  const { sharedT, locale } = useSharedTranslations();
  const { webT } = useWebTranslations();
  const queryClient = useQueryClient();
  const { viewDocument } = useViewDocument();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);

  const [searchValue, setSearchValue] = useState("");
  const [ilikeResults, setIlikeResults] = useState<Document[] | null>(null);

  const {
    data: documents,
    isPending,
    error,
    inViewRef,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQueryWithRPC({
    queryKey: ["documents"],
    queryFn: ({ pageParam }) =>
      apiFetcher(
        (client) =>
          client.documents.$get({
            query: {
              pageNumber: (pageParam ?? 0).toString(),
              itemsPerPage: "20",
            },
          }),
        sharedT.apiCodes,
      ),
  });

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchValue.trim().length > 1) {
        apiFetcher(
          (client) =>
            client.documents.ilike.$get({
              query: { prefix: searchValue.trim() },
            }),
          sharedT.apiCodes,
        ).then((results) => setIlikeResults(results as Document[]));
      } else {
        setIlikeResults(null);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [searchValue, sharedT.apiCodes]);

  const displayDocs = ilikeResults ?? documents;

  const confirmDelete = (doc: Document) => {
    setDocToDelete(doc);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!docToDelete) return;
    setDeletingId(docToDelete.id);
    setDeleteDialogOpen(false);

    try {
      await apiFetcher(
        (client) =>
          client.documents[":documentId"].$delete({
            param: { documentId: docToDelete.id },
          }),
        sharedT.apiCodes,
      );
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    } finally {
      setDeletingId(null);
      setDocToDelete(null);
    }
  };

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
              {webT.documentsPage.title}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {webT.documentsPage.subtitle}
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
          <Input
            placeholder={webT.searchSelection.documents}
            className="pl-8"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>

        {isPending ? (
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                className="bg-muted/50 h-16 rounded-lg border"
              />
            ))}
          </div>
        ) : error || !displayDocs ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-muted-foreground text-sm">
              {webT.documentsPage.errorLoading}
            </p>
          </div>
        ) : displayDocs.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed">
            <FileText className="text-muted-foreground size-10" />
            <div className="text-center">
              <p className="font-medium">{webT.documentsPage.noDocuments}</p>
              <p className="text-muted-foreground mt-1 text-sm">
                {webT.documentsPage.noDocumentsDescription}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-2">
            {displayDocs.map((doc) => {
              const config = kindConfig[doc.kind] || kindConfig.text;
              const Icon = config.icon;
              return (
                <div
                  key={doc.id}
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
                  <button
                    className="flex-1 cursor-pointer overflow-hidden text-left"
                    onClick={() => viewDocument(doc.id, doc.kind, doc.title)}
                  >
                    <h3 className="truncate font-medium">{doc.title}</h3>
                    <span className="text-muted-foreground text-xs">
                      {formatDate(doc.createdAt)}
                    </span>
                    <p className="text-muted-foreground truncate text-xs">
                      {doc.content.length >= 40
                        ? `${doc.content}...`
                        : doc.content}
                    </p>
                  </button>
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 text-xs capitalize",
                      config.badgeClass,
                    )}
                  >
                    {doc.kind}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => confirmDelete(doc)}
                    disabled={deletingId === doc.id}
                  >
                    {deletingId === doc.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </Button>
                </div>
              );
            })}
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

        <DeleteForm
          deleteDialogOpen={deleteDialogOpen}
          setDeleteDialogOpen={setDeleteDialogOpen}
          onDelete={handleDelete}
          type="document"
        />
      </div>
    </>
  );
});
