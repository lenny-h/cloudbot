import { type EditorContent } from "@/contexts/editor-context";
import { type EditorView as CodeMirrorEditorView } from "@codemirror/view";
import { type EditorView as ProseMirrorEditorView } from "prosemirror-view";
import { mathMarkdownSerializer } from "../prosemirror-math/utils/text-serializer";

export function syncEditorContentToLocalStorage(
  editorMode: "code" | "text",
  editorRef: React.RefObject<CodeMirrorEditorView | ProseMirrorEditorView | null>,
  setLocalStorageInput: React.Dispatch<React.SetStateAction<EditorContent>>,
) {
  if (!editorRef.current) return;

  switch (editorMode) {
    case "code": {
      const editor = editorRef.current as CodeMirrorEditorView;
      const content = editor.state.doc.toString();

      setLocalStorageInput((prev) => ({
        ...prev,
        content,
      }));
      break;
    }
    case "text": {
      const editor = editorRef.current as ProseMirrorEditorView;
      const content = mathMarkdownSerializer.serialize(editor.state.doc);

      setLocalStorageInput((prev) => ({
        ...prev,
        content,
      }));
      break;
    }
  }
}
