"use client";

import { useChatControl } from "@/contexts/chat-control-context";
import { useWebTranslations } from "@/contexts/web-translations";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { cn } from "@workspace/ui/lib/utils";
import { memo, useEffect, useState } from "react";
import { DocumentsList, FilesList, PromptsList } from "./add-context-lists";
import { AddPromptForm } from "./add-prompt-form";
import { SearchWithSelection } from "./search-with-selection";

interface AddContextProps {
  type: "files" | "documents" | "prompts";
}

export const AddContext = memo(({ type }: AddContextProps) => {
  const { webT } = useWebTranslations();
  const { isTemporary } = useChatControl();

  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [addPromptFormOpen, setAddPromptFormOpen] = useState(false);

  const shortcut = type === "files" ? "j" : type === "documents" ? "k" : "l";

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === shortcut && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [shortcut]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Badge
          className={cn(
            "inline-flex cursor-pointer items-center gap-1 rounded-md text-xs font-medium transition-colors",
            isTemporary
              ? "bg-muted/30 hover:bg-muted/40 text-background"
              : "bg-primary/20 hover:bg-primary/30 text-foreground",
          )}
          onClick={() => setOpen((open) => !open)}
        >
          {type === "files"
            ? webT.addContext.addFiles
            : type === "documents"
              ? webT.addContext.addDocuments
              : webT.addContext.addPrompts}
          <kbd className="bg-muted text-muted-foreground inline-flex h-4 items-center gap-1 rounded-xl border px-1.5 font-mono font-medium">
            <span className="text-xs">⌘</span>
            {shortcut}
          </kbd>
        </Badge>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          {addPromptFormOpen ? (
            <>
              <DialogTitle>{webT.addContext.addPrompts}</DialogTitle>
              <DialogDescription>
                {webT.addContext.description}
              </DialogDescription>
            </>
          ) : (
            <div className="flex items-center justify-between pr-6">
              <DialogTitle>
                {type === "files"
                  ? webT.addContext.searchFiles
                  : type === "documents"
                    ? webT.addContext.searchDocuments
                    : webT.addContext.searchPrompts}
              </DialogTitle>
              {type === "prompts" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddPromptFormOpen(true)}
                >
                  {webT.addContext.addPrompts}
                </Button>
              )}
            </div>
          )}
        </DialogHeader>
        {addPromptFormOpen ? (
          <AddPromptForm onClose={() => setAddPromptFormOpen(false)} />
        ) : (
          <>
            <SearchWithSelection
              type={type}
              inputValue={inputValue}
              onInputChange={(value) => setInputValue(value)}
            />
            {type === "prompts" ? (
              <PromptsList
                open={open}
                setOpen={setOpen}
                inputValue={inputValue}
                max={5}
              />
            ) : type === "files" ? (
              <FilesList
                open={open}
                setOpen={setOpen}
                inputValue={inputValue}
                max={5}
              />
            ) : (
              <DocumentsList
                open={open}
                setOpen={setOpen}
                inputValue={inputValue}
                max={1}
              />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
});
