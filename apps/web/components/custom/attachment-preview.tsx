"use client";

import type { Attachment } from "@workspace/api-routes/schemas/attachment-schema";
import { cn } from "@workspace/ui/lib/utils";
import {
  FileTextIcon,
  ImageIcon,
  Loader2Icon,
  PaperclipIcon,
  XIcon,
} from "lucide-react";
import Image from "next/image";

// ============================================================================
// Types
// ============================================================================

type MediaCategory = "image" | "document" | "unknown";

const mediaCategoryIcons: Record<MediaCategory, typeof ImageIcon> = {
  image: ImageIcon,
  document: FileTextIcon,
  unknown: PaperclipIcon,
};

// ============================================================================
// Utility Functions
// ============================================================================

const getMediaCategory = (mediaType: string): MediaCategory => {
  if (mediaType.startsWith("image/")) return "image";
  if (mediaType.startsWith("application/") || mediaType.startsWith("text/"))
    return "document";
  return "unknown";
};

/**
 * Strips the path prefix before the first '/' from a filename.
 * Returns empty string if no '/' is present.
 */
const getDisplayFilename = (filename: string): string =>
  filename.includes("/")
    ? filename.substring(filename.indexOf("/") + 1)
    : filename;

// ============================================================================
// AttachmentPreview
// ============================================================================

interface AttachmentPreviewProps {
  attachment: Attachment;
  isUploading?: boolean;
  onRemove?: () => void;
}

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
  attachment,
  isUploading = false,
  onRemove,
}) => {
  const { filename, mediaType, previewUrl } = attachment;
  const category = getMediaCategory(mediaType);
  const FallbackIcon = mediaCategoryIcons[category];
  const displayedFilename = getDisplayFilename(filename);

  const renderPreview = () => {
    if (isUploading) {
      return (
        <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
      );
    }

    if (previewUrl && category === "image") {
      return (
        <Image
          src={previewUrl}
          alt={filename}
          fill
          className="rounded-lg object-contain"
          unoptimized
        />
      );
    }

    return <FallbackIcon className="text-muted-foreground size-6" />;
  };

  return (
    <div className="group relative flex flex-col gap-1">
      <div
        className={cn(
          "relative flex h-24 w-24 flex-col items-center justify-center overflow-hidden rounded-lg",
          "bg-muted text-primary",
        )}
      >
        {renderPreview()}
      </div>

      {!isUploading && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={cn(
            "absolute -top-1 -right-1 cursor-pointer rounded-full p-0.5",
            "bg-background/80 backdrop-blur-sm",
            "opacity-0 transition-opacity group-hover:opacity-100",
            "hover:text-destructive",
          )}
          aria-label="Remove attachment"
          type="button"
        >
          <XIcon className="size-4" />
        </button>
      )}

      {displayedFilename && (
        <div className="w-24 truncate text-xs">{displayedFilename}</div>
      )}
      <div className="text-muted-foreground w-24 truncate text-[10px] uppercase">
        {mediaType.toUpperCase()}
      </div>
    </div>
  );
};
