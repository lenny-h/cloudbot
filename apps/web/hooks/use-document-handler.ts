import { createDiffViewString } from "@/components/editors/helper-functions/create-diff-view-string";
import { diffLines } from "@/components/editors/jsdiff/line";
import { useDiff } from "@/contexts/diff-context";
import { useEditor } from "@/contexts/editor-context";
import { useRefs } from "@/contexts/refs-context";
import { resizeEditor } from "@/lib/utils";
import { type ArtifactKind } from "@workspace/api-routes/schemas/artifact-schema";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { toast } from "sonner";

export function useDocumentHandler() {
  const { sharedT } = useSharedTranslations();
  const { panelRef, textEditorRef, codeEditorRef } = useRefs();
  const { setEditorMode, setDocumentIdentifier } = useEditor();
  const { textDiffPrev, setTextDiffNext, codeDiffPrev, setCodeDiffNext } =
    useDiff();

  const handleDocumentClick = ({
    documentId,
    documentTitle,
    documentKind,
  }: {
    documentId: string;
    documentTitle: string;
    documentKind: ArtifactKind;
  }) => {
    toast.promise(
      (async () => {
        const document = await apiFetcher(
          (client) =>
            client["documents"][":documentId"].$get({
              param: { documentId },
            }),
          sharedT.apiCodes,
        );

        if (!document.content) {
          throw new Error("Document content is empty");
        }

        setEditorMode(documentKind);

        if (documentKind === "text") {
          // Dynamically load the text editor update helper only when needed
          const { updateTextEditorWithDispatch } =
            await import("@/components/editors/helper-functions/update-text-editor-with-dispatch");
          updateTextEditorWithDispatch(textEditorRef, document.content);

          setDocumentIdentifier({
            id: documentId,
            title: documentTitle,
          });
        } else {
          // Dynamically load the code editor update helper only when needed
          const { updateCodeEditorWithDispatch } =
            await import("@/components/editors/helper-functions/update-code-editor-with-dispatch");
          updateCodeEditorWithDispatch(codeEditorRef, document.content);

          setDocumentIdentifier({
            id: documentId,
            title: documentTitle,
          });
        }

        resizeEditor(panelRef, false);
      })(),
      {
        loading: "Loading document...",
        success: "Document loaded successfully",
        error: (error) => "Error loading document: " + error,
      },
    );
  };

  const handleDiffClick = ({
    documentId,
    documentTitle,
    documentKind,
    previousText,
    newText,
  }: {
    documentId: string;
    documentTitle: string;
    documentKind: ArtifactKind;
    previousText: string;
    newText: string;
  }) => {
    toast.promise(
      (async () => {
        if (!textEditorRef.current || !codeEditorRef.current) {
          throw new Error("Editors are not initialized");
        }

        setEditorMode(documentKind);

        if (documentKind === "text") {
          textDiffPrev.current = textEditorRef.current.state;

          setTextDiffNext(newText);
          const diffResult = diffLines(newText, previousText);

          // Disable editing for the diff view
          textEditorRef.current.setProps({ editable: () => false });

          // Dynamically load the text editor update helper only when needed
          const { updateTextEditorWithDispatch } =
            await import("@/components/editors/helper-functions/update-text-editor-with-dispatch");
          updateTextEditorWithDispatch(
            textEditorRef,
            createDiffViewString(diffResult, true),
          );

          setDocumentIdentifier({
            id: documentId,
            title: documentTitle,
          });
        } else {
          codeDiffPrev.current = codeEditorRef.current.state;

          setCodeDiffNext(newText);
          const diffResult = diffLines(newText, previousText);

          // Dynamically Import StateEffect, EditorView
          const { StateEffect } = await import("@codemirror/state");
          const { EditorView } = await import("@codemirror/view");

          codeDiffPrev.current = codeEditorRef.current.state;
          setCodeDiffNext(newText);

          // Create a transaction that reconfigures the editable facet to false
          // This disables editing for the diff view
          const effect = StateEffect.reconfigure.of([
            EditorView.editable.of(false),
          ]);
          codeEditorRef.current.dispatch({ effects: effect });

          const { updateCodeEditorWithDispatch } =
            await import("@/components/editors/helper-functions/update-code-editor-with-dispatch");
          updateCodeEditorWithDispatch(
            codeEditorRef,
            createDiffViewString(diffResult, true),
          );

          setDocumentIdentifier({
            id: documentId,
            title: documentTitle,
          });
        }

        resizeEditor(panelRef, false);
      })(),
      {
        loading: "Loading document...",
        success: "Document loaded successfully",
        error: (error) => "Error loading document: " + error,
      },
    );
  };

  return { handleDocumentClick, handleDiffClick };
}
