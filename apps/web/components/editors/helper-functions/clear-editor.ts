import { type EditorView as CodeMirrorEditorView } from "@codemirror/view";
import { type EditorView } from "prosemirror-view";
import { type RefObject } from "react";

export const clearEditor = async (
  editorMode: "text" | "code" | "pdf",
  textEditorRef: RefObject<EditorView | null>,
  codeEditorRef: RefObject<CodeMirrorEditorView | null>,
) => {
  const { updateEditorWithDispatch } =
    await import("@/components/editors/helper-functions/update-editor-with-dispatch");

  switch (editorMode) {
    case "text": {
      updateEditorWithDispatch("text", textEditorRef, "");
      break;
    }
    case "code": {
      updateEditorWithDispatch("code", codeEditorRef, "");
      break;
    }
  }
};
