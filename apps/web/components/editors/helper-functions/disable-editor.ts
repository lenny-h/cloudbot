import { editableCompartment } from "@/components/editors/main/code-editor";
import { type EditorMode } from "@/contexts/editor-context";
import { type EditorView as CodeMirrorEditorView } from "@codemirror/view";
import { type EditorView } from "prosemirror-view";

export const disableEditor = async (
  editorMode: EditorMode,
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
        const { EditorView } = await import("@codemirror/view");

        // Reconfigure only the editable compartment, preserving all other extensions
        codeEditorRef.current.dispatch({
          effects: editableCompartment.reconfigure(
            EditorView.editable.of(false),
          ),
        });
      }
      break;
    }
  }
};
