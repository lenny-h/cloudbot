"use client";

import { Badge } from "@workspace/ui/components/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { cn } from "@workspace/ui/lib/utils";
import { type ToolUIPart } from "ai";
import {
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Globe,
  Loader2,
  XCircle,
} from "lucide-react";
import { useState } from "react";

type WebSource = {
  id: string;
  url: string;
  title: string;
};

interface ToolExtractFromWebProps {
  part: ToolUIPart<{
    extractFromWeb: {
      input: { informationToExtract: string };
      output: { extractedInformation: string; sources?: WebSource[] };
    };
  }>;
}

export function ToolExtractFromWeb({ part }: ToolExtractFromWebProps) {
  const [isOpen, setIsOpen] = useState(part.state === "output-available");
  const { state, input, output } = part;

  const getStatusBadge = () => {
    if (state === "input-streaming" || state === "input-available") {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Loader2 className="size-3 animate-spin" />
          <span>Running</span>
        </Badge>
      );
    }
    if (state === "output-error") {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="size-3" />
          <span>Error</span>
        </Badge>
      );
    }
    if (state === "output-denied") {
      return (
        <Badge
          variant="secondary"
          className="flex items-center gap-1 text-orange-600"
        >
          <XCircle className="size-3" />
          <span>Denied</span>
        </Badge>
      );
    }
    return (
      <Badge
        variant="secondary"
        className="flex items-center gap-1 text-green-600"
      >
        <CheckCircle2 className="size-3" />
        <span>Completed</span>
      </Badge>
    );
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="hover:bg-muted/50 w-full rounded-lg border transition-colors"
    >
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between gap-2 p-3">
        <div className="flex items-center gap-2">
          <Globe className="size-4 text-purple-600" />
          <span className="text-sm font-medium">Extract from Web</span>
          {getStatusBadge()}
        </div>
        <ChevronDown
          className={cn("size-4 transition-transform", isOpen && "rotate-180")}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t">
        <div className="space-y-3 p-3">
          {input && (
            <div className="space-y-1.5">
              <div className="text-muted-foreground text-xs font-medium">
                Information to Extract
              </div>
              <div className="bg-muted/50 rounded p-2 text-sm">
                {input.informationToExtract}
              </div>
            </div>
          )}

          {output &&
            state === "output-available" &&
            output.extractedInformation && (
              <div className="space-y-1.5">
                <div className="text-muted-foreground text-xs font-medium">
                  Extracted Information
                </div>
                <div className="bg-background rounded border p-3 text-sm whitespace-pre-wrap">
                  {output.extractedInformation}
                </div>
              </div>
            )}

          {output &&
            state === "output-available" &&
            output.sources &&
            output.sources.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-muted-foreground text-xs font-medium">
                  Web Sources
                  <span className="bg-muted text-muted-foreground ml-2 rounded-full px-1.5 py-0.5 text-xs">
                    {output.sources.length}
                  </span>
                </div>
                <div className="rounded border">
                  <ul className="divide-y">
                    {output.sources.map((source) => {
                      const hostname = source.url
                        ? new URL(source.url).hostname.replace("www.", "")
                        : null;
                      const faviconUrl = source.url
                        ? `https://www.google.com/s2/favicons?domain=${new URL(source.url).hostname}&sz=16`
                        : null;

                      const handleSourceClick = () => {
                        if (source.url)
                          window.open(
                            source.url,
                            "_blank",
                            "noopener,noreferrer",
                          );
                      };

                      return (
                        <li
                          key={source.id}
                          role={source.url ? "link" : undefined}
                          tabIndex={source.url ? 0 : undefined}
                          onClick={handleSourceClick}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ")
                              handleSourceClick();
                          }}
                          className={cn(
                            "group flex items-start gap-3 px-3 py-2.5",
                            source.url &&
                              "hover:bg-muted/50 cursor-pointer transition-colors",
                          )}
                        >
                          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center">
                            {faviconUrl ? (
                              <img
                                src={faviconUrl}
                                alt=""
                                width={16}
                                height={16}
                                className="size-4 rounded-sm"
                                onError={(e) => {
                                  (
                                    e.currentTarget as HTMLImageElement
                                  ).style.display = "none";
                                }}
                              />
                            ) : (
                              <Globe className="size-4 text-purple-600" />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            {source.title && (
                              <p className="truncate text-sm leading-snug font-medium">
                                {source.title}
                              </p>
                            )}
                            {hostname && (
                              <p className="text-muted-foreground truncate text-xs">
                                {hostname}
                              </p>
                            )}
                          </div>
                          {source.url && (
                            <ExternalLink className="text-muted-foreground mt-0.5 size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
