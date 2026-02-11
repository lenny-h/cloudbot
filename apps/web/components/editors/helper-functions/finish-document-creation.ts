import { type EditorState as CodeMirrorEditorState } from "@codemirror/state";
import { type EditorView as CodeMirrorEditorView } from "@codemirror/view";
import { type EditorState as ProseMirrorEditorState } from "prosemirror-state";
import { type EditorView as ProseMirrorEditorView } from "prosemirror-view";
import { type RefObject } from "react";

export async function finishDocumentCreation({
  editorMode,
  textDiffPrev,
  textEditorRef,
  codeDiffPrev,
  codeEditorRef,
}: {
  editorMode: "code" | "text" | "pdf";
  textDiffPrev: RefObject<ProseMirrorEditorState | undefined>;
  textEditorRef: RefObject<ProseMirrorEditorView | null>;
  codeDiffPrev: RefObject<CodeMirrorEditorState | undefined>;
  codeEditorRef: RefObject<CodeMirrorEditorView | null>;
}) {
  switch (editorMode) {
    case "code": {
      if (!codeDiffPrev.current || !codeEditorRef.current) {
        console.warn(
          "Code editor reference is null when processing finish event.",
        );
        return;
      }

      const prevState = codeDiffPrev.current;
      const content = codeEditorRef.current.state.doc.toString();

      const transaction = prevState.update({
        changes: {
          from: 0,
          to: codeEditorRef.current.state.doc.length,
          insert: content,
        },
      });

      codeEditorRef.current.setState(prevState);
      codeEditorRef.current.dispatch(transaction);
      codeDiffPrev.current = undefined;

      break;
    }
    case "text": {
      if (!textDiffPrev.current || !textEditorRef.current) {
        console.warn(
          "Text editor reference is null when processing finish event.",
        );
        return;
      }

      const tr = textDiffPrev.current.tr;
      tr.replaceWith(
        0,
        textDiffPrev.current.doc.content.size,
        textEditorRef.current.state.doc.content,
      );

      const newState = textDiffPrev.current.apply(tr);
      textEditorRef.current.updateState(newState);
      textEditorRef.current.setProps({ editable: () => true });
      textDiffPrev.current = undefined;

      break;
    }
  }
}
