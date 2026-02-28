import { useDiff } from "@/contexts/diff-context";
import { useEditor } from "@/contexts/editor-context";
import { useRefs } from "@/contexts/refs-context";
import { useCallback } from "react";

export function useDiffActions() {
  const { editorMode } = useEditor();
  const { textEditorRef, codeEditorRef } = useRefs();
  const { textDiffPrev, codeDiffPrev, setShowDiffActions } = useDiff();

  const handleTextDiffAction = useCallback(
    (acceptChanges: boolean) => {
      if (!textEditorRef.current || !textDiffPrev.current) return;

      if (acceptChanges) {
        const tr = textDiffPrev.current.tr;
        tr.replaceWith(
          0,
          textDiffPrev.current.doc.content.size,
          textEditorRef.current.state.doc.content,
        );

        const newState = textDiffPrev.current.apply(tr);
        if (newState) {
          textEditorRef.current.updateState(newState);
          textEditorRef.current.setProps({ editable: () => true });
        }
      } else {
        textEditorRef.current.updateState(textDiffPrev.current);
      }

      textDiffPrev.current = undefined;
    },
    [textEditorRef, textDiffPrev],
  );

  const handleCodeDiffAction = useCallback(
    (acceptChanges: boolean) => {
      if (!codeEditorRef.current || !codeDiffPrev.current) return;

      if (acceptChanges) {
        const prevState = codeDiffPrev.current;

        const transaction = prevState.update({
          changes: {
            from: 0,
            to: prevState.doc.length,
            insert: codeEditorRef.current.state.doc.toString(),
          },
        });

        codeEditorRef.current.setState(codeDiffPrev.current);
        codeEditorRef.current.dispatch(transaction);
      } else {
        codeEditorRef.current.setState(codeDiffPrev.current);
      }

      codeDiffPrev.current = undefined;
    },
    [codeEditorRef, codeDiffPrev],
  );

  const handleDiffAction = useCallback(
    (acceptChanges: boolean) => {
      setShowDiffActions(false);

      if (editorMode === "text") {
        handleTextDiffAction(acceptChanges);
      } else {
        handleCodeDiffAction(acceptChanges);
      }
    },
    [
      editorMode,
      handleTextDiffAction,
      handleCodeDiffAction,
      setShowDiffActions,
    ],
  );

  return {
    handleDiffAction,
  };
}
