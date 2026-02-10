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
  Globe,
  Loader2,
  XCircle,
} from "lucide-react";
import { useState } from "react";

interface ToolExtractFromWebProps {
  part: ToolUIPart<{
    extractFromWeb: {
      input: { informationToExtract: string };
      output: { response?: string; error?: string };
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
      className="w-full rounded-lg border"
    >
      <CollapsibleTrigger className="hover:bg-muted/50 flex w-full items-center justify-between gap-2 p-3 transition-colors">
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

          {output && state === "output-available" && output.response && (
            <div className="space-y-1.5">
              <div className="text-muted-foreground text-xs font-medium">
                Response
              </div>
              <div className="bg-background rounded border p-3 text-sm whitespace-pre-wrap">
                {output.response}
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
