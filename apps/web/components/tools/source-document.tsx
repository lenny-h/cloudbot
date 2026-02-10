"use client";

import { usePdf } from "@/contexts/pdf-context";
import { useRefs } from "@/contexts/refs-context";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { cn } from "@workspace/ui/lib/utils";
import { type SourceDocumentUIPart } from "ai";
import { ChevronDown, File } from "lucide-react";
import { useState } from "react";

interface ToolSourceDocumentProps {
  part: SourceDocumentUIPart;
}

export function ToolSourceDocument({ part }: ToolSourceDocumentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const { panelRef } = useRefs();
  const { openPdf } = usePdf();

  const filenameParts = part.filename?.split("/");
  const fileId = filenameParts?.[filenameParts.length - 1];
  const folderId = filenameParts?.[filenameParts.length - 2];

  const fileIsViewable =
    part.mediaType === "application/pdf" && folderId && fileId;

  const handleViewFile = () => {
    if (fileIsViewable) {
      openPdf(isMobile, panelRef, folderId, fileId);
    }
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full rounded-lg border"
    >
      <CollapsibleTrigger className="hover:bg-muted/50 flex w-full items-center justify-between gap-2 p-3 transition-colors">
        <div className="flex items-center gap-2">
          <File className="size-4 text-blue-600" />
          <span className="text-sm font-medium">Document Source</span>
        </div>
        <ChevronDown
          className={cn("size-4 transition-transform", isOpen && "rotate-180")}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t">
        <div className="space-y-3 p-3">
          {part.title && (
            <div className="space-y-1.5">
              <div className="text-muted-foreground text-xs font-medium">
                Title
              </div>
              <div className="bg-muted/50 rounded p-2 text-sm">
                {part.title}
              </div>
            </div>
          )}

          {part.filename && (
            <div className="space-y-1.5">
              <div className="text-muted-foreground text-xs font-medium">
                Filename
              </div>
              <div className="bg-muted/50 rounded p-2 text-sm font-mono break-all">
                {part.filename}
              </div>
            </div>
          )}

          {part.mediaType && (
            <div className="space-y-1.5">
              <div className="text-muted-foreground text-xs font-medium">
                Media Type
              </div>
              <div className="bg-muted/50 rounded p-2 text-sm">
                {part.mediaType}
              </div>
            </div>
          )}

          {fileIsViewable && (
            <button
              onClick={handleViewFile}
              className="hover:bg-primary/10 text-primary w-full rounded p-2 text-sm font-medium transition-colors"
            >
              View Document
            </button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
