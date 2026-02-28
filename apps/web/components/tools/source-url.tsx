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
  parts: SourceUrlUIPart[];
}

export function ToolSourceUrl({ parts }: ToolSourceUrlProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (parts.length === 0) return null;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full rounded-lg border"
    >
      <CollapsibleTrigger className="hover:bg-muted/50 flex w-full items-center justify-between gap-2 p-3 transition-colors">
        <div className="flex items-center gap-2">
          <Globe className="size-4 text-purple-600" />
          <span className="text-sm font-medium">
            Web Sources
            <span className="bg-muted text-muted-foreground ml-2 rounded-full px-1.5 py-0.5 text-xs">
              {parts.length}
            </span>
          </span>
        </div>
        <ChevronDown
          className={cn("size-4 transition-transform", isOpen && "rotate-180")}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t">
        <ul className="divide-y">
          {parts.map((part, i) => {
            const hostname = part.url
              ? new URL(part.url).hostname.replace("www.", "")
              : null;
            const faviconUrl = part.url
              ? `https://www.google.com/s2/favicons?domain=${new URL(part.url).hostname}&sz=16`
              : null;

            const handleClick = () => {
              if (part.url) window.open(part.url, "_blank", "noopener,noreferrer");
            };

            return (
              <li
                key={i}
                role={part.url ? "link" : undefined}
                tabIndex={part.url ? 0 : undefined}
                onClick={handleClick}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleClick();
                }}
                className={cn(
                  "group flex items-start gap-3 px-3 py-2.5",
                  part.url && "hover:bg-muted/50 cursor-pointer transition-colors",
                )}
              >
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center">
                  {faviconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={faviconUrl}
                      alt=""
                      width={16}
                      height={16}
                      className="size-4 rounded-sm"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <Globe className="size-4 text-purple-600" />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  {part.title && (
                    <p className="truncate text-sm font-medium leading-snug">
                      {part.title}
                    </p>
                  )}
                  {hostname && (
                    <p className="text-muted-foreground truncate text-xs">
                      {hostname}
                    </p>
                  )}
                  {!part.title && !hostname && part.url && (
                    <p className="text-muted-foreground truncate font-mono text-xs">
                      {part.url}
                    </p>
                  )}
                </div>

                {part.url && (
                  <ExternalLink className="text-muted-foreground mt-0.5 size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                )}
              </li>
            );
          })}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
