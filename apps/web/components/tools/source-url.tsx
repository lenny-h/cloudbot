"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { cn } from "@workspace/ui/lib/utils";
import { type SourceUrlUIPart } from "ai";
import { ChevronDown, ExternalLink, Globe } from "lucide-react";
import { useState } from "react";

interface ToolSourceUrlProps {
  part: SourceUrlUIPart;
}

export function ToolSourceUrl({ part }: ToolSourceUrlProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hostname = part.url ? new URL(part.url).hostname.replace("www.", "") : "";

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full rounded-lg border"
    >
      <CollapsibleTrigger className="hover:bg-muted/50 flex w-full items-center justify-between gap-2 p-3 transition-colors">
        <div className="flex items-center gap-2">
          <Globe className="size-4 text-purple-600" />
          <span className="text-sm font-medium">Web Source</span>
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

          {hostname && (
            <div className="space-y-1.5">
              <div className="text-muted-foreground text-xs font-medium">
                Hostname
              </div>
              <div className="bg-muted/50 rounded p-2 text-sm">
                {hostname}
              </div>
            </div>
          )}

          {part.url && (
            <div className="space-y-1.5">
              <div className="text-muted-foreground text-xs font-medium">
                URL
              </div>
              <div className="bg-muted/50 rounded p-2 text-sm font-mono break-all">
                {part.url}
              </div>
            </div>
          )}

          {part.url && (
            <button
              onClick={() => window.open(part.url, "_blank")}
              className="hover:bg-primary/10 text-primary flex w-full items-center justify-center gap-2 rounded p-2 text-sm font-medium transition-colors"
            >
              Open in New Tab
              <ExternalLink className="size-3" />
            </button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
