"use client";

import { useViewDocument } from "@/hooks/use-view-document";
import { type ArtifactKind } from "@workspace/api-routes/schemas/artifact-schema";
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
  Eye,
  FilePlus,
  Loader2,
  XCircle,
} from "lucide-react";
import { useState } from "react";

interface ToolCreateDocumentProps {
  part: ToolUIPart<{
    createDocument: {
      input: { title: string; kind: ArtifactKind; description: string };
      output: {
        id: string;
        title: string;
        kind: ArtifactKind;
        message: string;
      };
    };
  }>;
}

export function ToolCreateDocument({ part }: ToolCreateDocumentProps) {
  const [isOpen, setIsOpen] = useState(part.state === "output-available");
  const { state, input, output } = part;
  const { viewDocument } = useViewDocument();

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
      className="hover:bg-muted/50 w-full rounded-lg border transition-colors"
    >
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between gap-2 p-3">
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
                  Kind
                </div>
                <Badge variant="outline" className="text-xs">
                  {input.kind}
                </Badge>
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

              {output && state === "output-available" && (
                <Button
                  onClick={() =>
                    viewDocument(output.id, output.kind, output.title)
                  }
                  className="w-full"
                  size="sm"
                  variant="outline"
                >
                  <Eye className="mr-2 size-4" />
                  View Document
                </Button>
              )}
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
