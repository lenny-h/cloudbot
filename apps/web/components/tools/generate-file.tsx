"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
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
import { useCallback, useState } from "react";

interface ToolGenerateFileProps {
  part: ToolUIPart<{
    generateFile: {
      input: { title: string; format: string; description: string };
      output: {
        fileId: string;
        filename: string;
        format: string;
        contentType: string;
        size: number;
        message: string;
      };
    };
  }>;
}

export function ToolGenerateFile({ part }: ToolGenerateFileProps) {
  const { state, input, output } = part;
  const { sharedT } = useSharedTranslations();

  const [isOpen, setIsOpen] = useState(part.state === "output-available");
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!output) return;
    setIsDownloading(true);
    try {
      const extension = output.filename.split(".").pop() ?? "";
      const { signedUrl } = await apiFetcher(
        (client) =>
          client.artifacts["get-signed-url"][":fileId"][":extension"].$get({
            param: { fileId: output.fileId, extension },
          }),
        sharedT.apiCodes,
      );
      window.open(signedUrl, "_blank");
    } finally {
      setIsDownloading(false);
    }
  }, [output, sharedT.apiCodes]);

  const humanFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

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
                  Title
                </div>
                <div className="text-sm font-medium">{input.title}</div>
              </div>

              <div className="flex gap-4">
                <div className="space-y-1.5">
                  <div className="text-muted-foreground text-xs font-medium">
                    Format
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {input.format}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-muted-foreground text-xs font-medium">
                  Description
                </div>
                <div className="bg-muted/30 max-h-60 overflow-y-auto rounded border p-3">
                  <pre className="font-mono text-xs whitespace-pre-wrap">
                    {input.description}
                  </pre>
                </div>
              </div>
            </>
          )}

          {output && state === "output-available" && (
            <div className="space-y-3 rounded border border-cyan-200 bg-cyan-50 p-3 dark:border-cyan-900 dark:bg-cyan-950/20">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div>
                  <div className="text-muted-foreground text-xs font-medium">Filename</div>
                  <code className="font-mono text-sm">{output.filename}</code>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs font-medium">Format</div>
                  <Badge variant="outline" className="text-xs">{output.format}</Badge>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs font-medium">Size</div>
                  <div className="text-sm">{humanFileSize(output.size)}</div>
                </div>
              </div>
              <div className="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={handleDownload}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Download className="size-4" />
                  )}
                  Download
                </Button>
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
