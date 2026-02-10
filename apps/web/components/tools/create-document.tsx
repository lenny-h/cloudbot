"use client";

import { Badge } from "@workspace/ui/components/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { cn } from "@workspace/ui/lib/utils";
import { ToolUIPart } from "ai";
import {
  CheckCircle2,
  ChevronDown,
  FilePlus,
  Loader2,
  XCircle,
} from "lucide-react";
import { useState } from "react";

interface ToolCreateDocumentProps {
  part: ToolUIPart<{
    createDocument: {
      input: { title: string; content: string };
      output: { documentId: string };
    };
  }>;
}

export function ToolCreateDocument({ part }: ToolCreateDocumentProps) {
  const [isOpen, setIsOpen] = useState(part.state === "output-available");
  const { state, input, output } = part;

  const getStatusBadge = () => {
    if (state === "input-streaming" || state === "input-available") {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Loader2 className="size-3 animate-spin" />
          <span>Creating</span>
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
        <span>Created</span>
      </Badge>
    );
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full rounded-lg border"
    >
      <CollapsibleTrigger className="hover:bg-muted/50 flex w-full items-center justify-between gap-2 p-3 transition-colors">
        <div className="flex items-center gap-2">
          <FilePlus className="size-4 text-green-600" />
          <span className="text-sm font-medium">Create Document</span>
          {getStatusBadge()}
        </div>
        <ChevronDown
          className={cn("size-4 transition-transform", isOpen && "rotate-180")}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t">
        <div className="space-y-3 p-3">
          {input && (
            <>
              <div className="space-y-1.5">
                <div className="text-muted-foreground text-xs font-medium">
                  Title
                </div>
                <div className="text-sm font-medium">{input.title}</div>
              </div>

              <div className="space-y-1.5">
                <div className="text-muted-foreground text-xs font-medium">
                  Content
                </div>
                <div className="bg-muted/30 max-h-60 overflow-y-auto rounded border p-3">
                  <pre className="font-mono text-xs whitespace-pre-wrap">
                    {input.content}
                  </pre>
                </div>
              </div>
            </>
          )}

          {output && state === "output-available" && output.documentId && (
            <div className="rounded border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/20">
              <div className="text-muted-foreground mb-1 text-xs font-medium">
                Document Id
              </div>
              <code className="font-mono text-sm text-green-700 dark:text-green-400">
                {output.documentId}
              </code>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
