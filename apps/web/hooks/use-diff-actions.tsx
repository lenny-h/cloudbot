import { updateEditorWithDispatch } from "@/components/editors/helper-functions/update-editor-with-dispatch";
import { useDiff } from "@/contexts/diff-context";
import { useEditor } from "@/contexts/editor-context";
import { useRefs } from "@/contexts/refs-context";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { useCallback } from "react";
import { toast } from "sonner";

export function useDiffActions() {
  const { editorMode } = useEditor();
  const { textEditorRef, codeEditorRef } = useRefs();
  const { sharedT } = useSharedTranslations();
  const {
    textDiffPrev,
    codeDiffPrev,
    textStreamBuffer,
    codeStreamBuffer,
    currentDiffId,
    setCurrentDiffId,
  } = useDiff();

  const handleTextDiffAction = useCallback(
    (acceptChanges: boolean) => {
      if (!textEditorRef.current || !textDiffPrev.current) return;

      if (acceptChanges) {
        // Restore previous clean state, then apply the buffered accepted content
        textEditorRef.current.updateState(textDiffPrev.current);
        textEditorRef.current.setProps({ editable: () => true });

        if (textStreamBuffer.current) {
          updateEditorWithDispatch(
            "text",
            textEditorRef,
            textStreamBuffer.current,
          );
        }
      } else {
        textEditorRef.current.updateState(textDiffPrev.current);
        textEditorRef.current.setProps({ editable: () => true });
      }

      textDiffPrev.current = undefined;
      textStreamBuffer.current = "";
    },
    [textEditorRef, textDiffPrev, textStreamBuffer],
  );

  const handleCodeDiffAction = useCallback(
    (acceptChanges: boolean) => {
      if (!codeEditorRef.current || !codeDiffPrev.current) return;

      if (acceptChanges) {
        // Restore previous clean state, then apply the buffered accepted content
        codeEditorRef.current.setState(codeDiffPrev.current);

        if (codeStreamBuffer.current) {
          updateEditorWithDispatch(
            "code",
            codeEditorRef,
            codeStreamBuffer.current,
          );
        }
      } else {
        codeEditorRef.current.setState(codeDiffPrev.current);
      }

      codeDiffPrev.current = undefined;
      codeStreamBuffer.current = "";
    },
    [codeEditorRef, codeDiffPrev, codeStreamBuffer],
  );

  const handleDiffAction = useCallback(
    (acceptChanges: boolean) => {
      if (editorMode === "text") {
        handleTextDiffAction(acceptChanges);
      } else {
        handleCodeDiffAction(acceptChanges);
      }

      if (acceptChanges && currentDiffId) {
        toast.promise(
          apiFetcher(
            (client) =>
              client["documents"]["accept-diff"][":diffId"].$patch({
                param: { diffId: currentDiffId },
              }),
            sharedT.apiCodes,
          ),
          {
            loading: "Accepting diff...",
            success: "Diff accepted",
            error: (error) => "Error accepting diff: " + error,
          },
        );
      }

      setCurrentDiffId(null);
    },
    [
      editorMode,
      handleTextDiffAction,
      handleCodeDiffAction,
      currentDiffId,
      setCurrentDiffId,
      sharedT,
    ],
  );

  return {
    handleDiffAction,
  };
}
