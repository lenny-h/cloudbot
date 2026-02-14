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
  FileText,
  Loader2,
  XCircle,
} from "lucide-react";
import { useState } from "react";

interface ToolExtractFromDocumentsProps {
  part: ToolUIPart<{
    extractFromDocuments: {
      input: { query: string; max_num_results?: number };
      output: { extractedInformation?: string; error?: string };
    };
  }>;
}

export function ToolExtractFromDocuments({
  part,
}: ToolExtractFromDocumentsProps) {
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
          <FileText className="size-4 text-blue-600" />
          <span className="text-sm font-medium">Extract from Documents</span>
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
                Query
              </div>
              <div className="bg-muted/50 rounded p-2 text-sm">
                {input.query}
              </div>
              {input.max_num_results && (
                <div className="text-muted-foreground text-xs">
                  Max results: {input.max_num_results}
                </div>
              )}
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
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
