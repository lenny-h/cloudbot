"use client";

import { useWebTranslations } from "@/contexts/web-translations";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { useInfiniteQueryWithRPC } from "@workspace/ui/hooks/use-infinite-query";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { Loader2, MessageSquare, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { memo, useEffect, useState } from "react";
import { DeleteForm } from "./delete-form";

interface Chat {
  id: string;
  title: string;
  createdAt: string;
}

export const ChatsPage = memo(() => {
  const { sharedT, locale } = useSharedTranslations();
  const { webT } = useWebTranslations();
  const queryClient = useQueryClient();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<Chat | null>(null);

  const [searchValue, setSearchValue] = useState("");
  const [ilikeResults, setIlikeResults] = useState<Chat[] | null>(null);

  const {
    data: chats,
    isPending,
    error,
    inViewRef,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQueryWithRPC({
    queryKey: ["chats"],
    queryFn: ({ pageParam }) =>
      apiFetcher(
        (client) =>
          client.chats.$get({
            query: {
              pageNumber: (pageParam ?? 0).toString(),
              itemsPerPage: "10",
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
            client.chats.ilike.$get({
              query: { prefix: searchValue.trim() },
            }),
          sharedT.apiCodes,
        ).then((results) => setIlikeResults(results as Chat[]));
      } else {
        setIlikeResults(null);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [searchValue, sharedT.apiCodes]);

  const displayChats = ilikeResults ?? chats;

  const confirmDelete = (chat: Chat) => {
    setChatToDelete(chat);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!chatToDelete) return;
    setDeletingId(chatToDelete.id);
    setDeleteDialogOpen(false);

    try {
      await apiFetcher(
        (client) =>
          client.chats[":chatId"].$delete({
            param: { chatId: chatToDelete.id },
          }),
        sharedT.apiCodes,
      );
      queryClient.invalidateQueries({ queryKey: ["all-chats"] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    } finally {
      setDeletingId(null);
      setChatToDelete(null);
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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 md:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {webT.chatsPage.title}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {webT.chatsPage.subtitle}
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
        <Input
          placeholder={webT.searchSelection.chats}
          className="pl-8"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>

      {isPending ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="bg-muted/50 h-16 rounded-lg border" />
          ))}
        </div>
      ) : error || !displayChats ? (
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground text-sm">
            {webT.chatsPage.errorLoading}
          </p>
        </div>
      ) : displayChats.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed">
          <MessageSquare className="text-muted-foreground size-10" />
          <div className="text-center">
            <p className="font-medium">{webT.chatsPage.noChats}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {webT.chatsPage.noChatsDescription}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-2">
          {displayChats.map((chat) => (
            <Link
              key={chat.id}
              href={`/${locale}/chat/${chat.id}`}
              className="hover:bg-muted/30 group flex items-center gap-3 rounded-lg border p-3 transition-colors"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <MessageSquare className="size-4" />
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="truncate font-medium">
                  {chat.title || "Untitled Chat"}
                </h3>
                <p className="text-muted-foreground text-xs">
                  {formatDate(chat.createdAt)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => {
                  e.preventDefault();
                  confirmDelete(chat);
                }}
                disabled={deletingId === chat.id}
              >
                {deletingId === chat.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </Button>
            </Link>
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

      <DeleteForm
        deleteDialogOpen={deleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        onDelete={handleDelete}
        type="chat"
      />
    </div>
  );
});
