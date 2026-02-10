"use client";

import { usePdf } from "@/contexts/pdf-context";
import { useWebTranslations } from "@/contexts/web-translations";
import { useRef, useState } from "react";

export const PDFViewer = () => {
  const { webT } = useWebTranslations();
  const { currentPdfUrl, isFetching } = usePdf();

  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!currentPdfUrl) {
    return (
      <div className="bg-muted/20 flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">{webT.pdfViewer.noPdfSelected}</p>
      </div>
    );
  }

  if (isFetching) {
    return (
      <div className="bg-muted/20 flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">{webT.pdfViewer.authenticating}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-muted/20 flex flex-1 items-center justify-center">
        <p className="text-red-500">{webT.pdfViewer.failedToLoadPdf}</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative flex-1 overflow-auto">
      <div className="relative size-full">
        <iframe
          key={`pdf-viewer-${currentPdfUrl}`}
          className="size-full"
          src={currentPdfUrl}
          title="PDF Viewer"
          onError={() => {
            setError("Failed to load PDF");
          }}
          loading="lazy"
        />
      </div>
    </div>
  );
};
