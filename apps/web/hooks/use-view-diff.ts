import { useEditor } from "@/contexts/editor-context";
import { useRefs } from "@/contexts/refs-context";
import { resizeEditor } from "@/lib/utils";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { toast } from "sonner";

export function useViewDiff() {
  const { sharedT } = useSharedTranslations();
  const { panelRef, textEditorRef, codeEditorRef } = useRefs();
  const {
    setEditorMode,
    setTextDocumentIdentifier,
    setCodeDocumentIdentifier,
  } = useEditor();

  const viewDiff = (
    diffId: string,
    documentId: string,
    documentTitle: string,
  ) => {
    toast.promise(
      (async () => {
        const diff = await apiFetcher(
          (client) =>
            client["documents"]["view-diff"][":diffId"].$get({
              param: { diffId },
            }),
          sharedT.apiCodes,
        );

        if (!diff.newText) {
          throw new Error("Diff content is empty");
        }

        const kind = diff.kind as "text" | "code";
        setEditorMode(kind);

        const { updateEditorWithDispatch } = await import(
          "@/components/editors/helper-functions/update-editor-with-dispatch"
        );

        if (kind === "text") {
          updateEditorWithDispatch("text", textEditorRef, diff.newText);
          setTextDocumentIdentifier({ id: documentId, title: documentTitle });
        } else {
          updateEditorWithDispatch("code", codeEditorRef, diff.newText);
          setCodeDocumentIdentifier({ id: documentId, title: documentTitle });
        }

        resizeEditor(panelRef, false);
      })(),
      {
        loading: "Loading diff...",
        success: "Diff loaded successfully",
        error: (error) => "Error loading diff: " + error,
      },
    );
  };

  return { viewDiff };
}
