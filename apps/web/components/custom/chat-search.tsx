"use client";

import { useWebTranslations } from "@/contexts/web-translations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { useRouter } from "next/navigation";
import { memo, ReactNode, useEffect, useState } from "react";
import { FilterableList, type ListItem } from "./filterable-list";
import { SearchWithSelection } from "./search-with-selection";

export const ChatSearch = memo(({ children }: { children: ReactNode }) => {
  const { webT } = useWebTranslations();

  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "a" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{webT.chatSearch.searchChats}</DialogTitle>
        </DialogHeader>
        <SearchWithSelection
          type="chats"
          inputValue={inputValue}
          onInputChange={setInputValue}
          showCurrentSelection={false}
        />
        <ChatsList open={open} setOpen={setOpen} inputValue={inputValue} />
      </DialogContent>
    </Dialog>
  );
});

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  inputValue: string;
}

interface Chat extends ListItem {
  id: string;
  title: string;
}

export const ChatsList = memo(({ open, setOpen, inputValue }: Props) => {
  const { locale, sharedT } = useSharedTranslations();
  const router = useRouter();

  const handleItemClick = (item: ListItem) => {
    const chat = item as Chat;
    router.push(`/${locale}/chat/${chat.id}`);
    setOpen(false);
  };

  return (
    <FilterableList
      open={open}
      inputValue={inputValue}
      queryKey={["chats"]}
      queryFn={({ pageParam }) =>
        apiFetcher(
          (client) =>
            client.chats.$get({
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
            client.chats.ilike.$get({
              query: {
                prefix,
              },
            }),
          sharedT.apiCodes,
        )
      }
      selectedItems={[]}
      onToggleItem={handleItemClick}
      maxItems={1}
    />
  );
});
