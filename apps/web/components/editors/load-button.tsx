"use client";

import { useWebTranslations } from "@/contexts/web-translations";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { KeyboardShortcut } from "@workspace/ui/shared-components/keyboard-shortcut";
import { memo, useEffect, useState } from "react";
import { SearchWithSelection } from "../custom/search-with-selection";
import { DocumentsList, FilesList } from "./load-button-lists";

interface LoadButtonProps {
  type: "files" | "documents";
}

export const LoadButton = memo(({ type }: LoadButtonProps) => {
  const { webT } = useWebTranslations();

  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "o" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="px-2" variant="outline">
          {webT.loadButton.load}
          <KeyboardShortcut keys={["⌘", "o"]} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {type === "files"
              ? webT.loadButton.searchFiles
              : webT.loadButton.searchDocuments}
          </DialogTitle>
        </DialogHeader>
        <SearchWithSelection
          type={type}
          inputValue={inputValue}
          onInputChange={(value) => setInputValue(value)}
          showCurrentSelection={false}
        />
        {type === "files" ? (
          <FilesList open={open} setOpen={setOpen} inputValue={inputValue} />
        ) : (
          <DocumentsList
            open={open}
            setOpen={setOpen}
            inputValue={inputValue}
          />
        )}
      </DialogContent>
    </Dialog>
  );
});
