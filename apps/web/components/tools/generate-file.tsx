"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
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
  Download,
  FileCode,
  Loader2,
  XCircle,
} from "lucide-react";
import { useState } from "react";

interface ToolGenerateFileProps {
  part: ToolUIPart<{
    generateFile: {
      input: { fileName: string; content: string };
      output: { fileUrl?: string; error?: string };
    };
  }>;
}

export function ToolGenerateFile({ part }: ToolGenerateFileProps) {
  const [isOpen, setIsOpen] = useState(part.state === "output-available");
  const { state, input, output } = part;

  const getStatusBadge = () => {
    if (state === "input-streaming" || state === "input-available") {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Loader2 className="size-3 animate-spin" />
          <span>Generating</span>
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
        <span>Generated</span>
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
          <FileCode className="size-4 text-cyan-600" />
          <span className="text-sm font-medium">Generate File</span>
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
                  File Name
                </div>
                <code className="bg-muted/50 rounded px-2 py-1 font-mono text-sm">
                  {input.fileName}
                </code>
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

          {output && state === "output-available" && output.fileUrl && (
            <div className="rounded border border-cyan-200 bg-cyan-50 p-3 dark:border-cyan-900 dark:bg-cyan-950/20">
              <Button size="sm" variant="outline" className="gap-2" asChild>
                <a
                  href={output.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                >
                  <Download className="size-4" />
                  Download File
                </a>
              </Button>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
