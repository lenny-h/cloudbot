"use client";

import { usePdf } from "@/contexts/pdf-context";
import { useRefs } from "@/contexts/refs-context";
import { Button } from "@workspace/ui/components/button";
import { X } from "lucide-react";
import { LoadButton } from "../load-button";
import { ModeSwitcher } from "../mode-switcher";

export const PdfHeader = () => {
  const { currentFilename } = usePdf();
  const { panelRef } = useRefs();

  return (
    <div className="bg-sidebar flex h-14 items-center gap-2 border-b px-3">
      <Button variant="ghost" onClick={() => panelRef.current?.collapse()}>
        <X />
      </Button>

      <span className="flex-1 truncate text-lg font-semibold">
        {currentFilename || "PDF Document"}
      </span>

      <ModeSwitcher />

      <LoadButton type="files" />
    </div>
  );
};
