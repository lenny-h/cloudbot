"use client";

import { EditorHeader } from "@/components/editors/editor-header";
import { EditorWrapper } from "@/components/editors/main/editor-wrapper";
import { PdfHeader } from "@/components/editors/main/pdf-header";
import { PDFViewer } from "@/components/editors/main/pdf-viewer";
import { useEditor } from "@/contexts/editor-context";
import { useRefs } from "@/contexts/refs-context";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@workspace/ui/components/resizable";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { useEffect } from "react";

// const EditorWrapper = dynamic(() =>
//   import("@/components/editors/editor-wrapper").then((mod) => mod.EditorWrapper)
// );

export default function Template({ children }: { children: React.ReactNode }) {
  const { panelRef, setSize } = useRefs();
  const { editorMode } = useEditor();

  const isMobile = useIsMobile();

  const minSize = isMobile ? 50 : 35;
  const maxSize = isMobile ? 50 : 70;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "i" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (panelRef.current?.isCollapsed()) {
          panelRef.current?.expand();
        } else {
          panelRef.current?.collapse();
        }
      }
    };

    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  return (
    <ResizablePanelGroup orientation="horizontal">
      <ResizablePanel className="h-svh" defaultSize={100} collapsible>
        {children}
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel
        className="flex h-svh min-w-0 flex-col"
        collapsible
        defaultSize={0}
        onResize={(panelSize) => {
          setSize(panelSize.asPercentage);
          if (panelSize.asPercentage < minSize) {
            panelRef.current?.collapse();
          } else if (panelSize.asPercentage >= maxSize) {
            panelRef.current?.resize(100);
          }
        }}
        panelRef={panelRef}
      >
        {editorMode === "pdf" ? (
          <>
            <PdfHeader />
            <PDFViewer />
          </>
        ) : (
          <>
            <EditorHeader />
            <EditorWrapper />
          </>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
