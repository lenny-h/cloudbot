import { type EditorView as CodeMirrorEditorView } from "@codemirror/view";
import { type EditorView } from "prosemirror-view";

export const disableEditor = async (
  editorMode: "text" | "code" | "pdf",
  textEditorRef: React.RefObject<EditorView | null>,
  codeEditorRef: React.RefObject<CodeMirrorEditorView | null>,
) => {
  switch (editorMode) {
    case "text": {
      if (textEditorRef.current) {
        textEditorRef.current.setProps({
          editable: () => false,
        });
      }
      break;
    }
    case "code": {
      if (codeEditorRef.current) {
        // Dynamically Import StateEffect, EditorView
        const { StateEffect } = await import("@codemirror/state");
        const { EditorView } = await import("@codemirror/view");

        // Create a transaction that reconfigures the editable facet to false
        // This disables editing while streaming
        const effect = StateEffect.reconfigure.of([
          EditorView.editable.of(false),
        ]);

        codeEditorRef.current.dispatch({ effects: effect });
      }
      break;
    }
  }
};
