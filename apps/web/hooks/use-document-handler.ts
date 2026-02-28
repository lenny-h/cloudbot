import { createDiffViewString } from "@/components/editors/helper-functions/create-diff-view-string";
import { diffLines } from "@/components/editors/jsdiff/line";
import { editableCompartment } from "@/components/editors/main/code-editor";
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
  const {
    setEditorMode,
    setTextDocumentIdentifier,
    setCodeDocumentIdentifier,
  } = useEditor();
  const { textDiffPrev, codeDiffPrev, setShowDiffActions } = useDiff();

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

        const { updateEditorWithDispatch } =
          await import("@/components/editors/helper-functions/update-editor-with-dispatch");

        if (documentKind === "text") {
          updateEditorWithDispatch("text", textEditorRef, document.content);

          setTextDocumentIdentifier({
            id: documentId,
            title: documentTitle,
          });
        } else {
          updateEditorWithDispatch("code", codeEditorRef, document.content);

          setCodeDocumentIdentifier({
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

        const { updateEditorWithDispatch } =
          await import("@/components/editors/helper-functions/update-editor-with-dispatch");

        if (documentKind === "text") {
          textDiffPrev.current = textEditorRef.current.state;

          const diffResult = diffLines(newText, previousText);

          // Disable editing for the diff view
          textEditorRef.current.setProps({ editable: () => false });

          updateEditorWithDispatch(
            "text",
            textEditorRef,
            createDiffViewString(diffResult, true),
          );

          setTextDocumentIdentifier({
            id: documentId,
            title: documentTitle,
          });
        } else {
          codeDiffPrev.current = codeEditorRef.current.state;

          const diffResult = diffLines(newText, previousText);

          // Reconfigure only the editable compartment, preserving all other extensions
          const { EditorView } = await import("@codemirror/view");
          codeEditorRef.current.dispatch({
            effects: editableCompartment.reconfigure(
              EditorView.editable.of(false),
            ),
          });

          updateEditorWithDispatch(
            "code",
            codeEditorRef,
            createDiffViewString(diffResult, true),
          );

          setCodeDocumentIdentifier({
            id: documentId,
            title: documentTitle,
          });
        }

        setShowDiffActions(true);

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
