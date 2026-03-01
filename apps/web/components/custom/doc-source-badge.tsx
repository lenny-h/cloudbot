"use client";

import { usePdf } from "@/contexts/pdf-context";
import { useRefs } from "@/contexts/refs-context";
import { type DocumentSource } from "@workspace/api-routes/lib/tools/extract-from-documents";
import { Badge } from "@workspace/ui/components/badge";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { cn } from "@workspace/ui/lib/utils";
import { File } from "lucide-react";

interface SourceBadgeProps {
  source: DocumentSource;
  className?: string;
}

export function DocSourceBadge({ source, className }: SourceBadgeProps) {
  const isMobile = useIsMobile();

  const { panelRef } = useRefs();
  const { openPdf } = usePdf();

  const fileIsViewable = source.filename.toLowerCase().endsWith(".pdf");

  const handleClick = () => {
    if (fileIsViewable) {
      openPdf(isMobile, panelRef, source.folderId, source.filename);
    }
  };

  return (
    <Badge
      onClick={handleClick}
      className={cn(
        "bg-primary/10 inline-flex items-center gap-1 rounded text-xs font-medium transition-colors",
        fileIsViewable
          ? "hover:bg-primary/20 cursor-pointer"
          : "cursor-default opacity-75",
        className,
      )}
    >
      <File size={10} className="text-primary" />
      <span className="text-foreground">{source.filename}</span>
    </Badge>
  );
}
