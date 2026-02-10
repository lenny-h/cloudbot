import { type EditorContent } from "@/contexts/editor-context";
import { type EditorView } from "@codemirror/view";

export function syncCodeEditorContentToLocalStorage(
  editorRef: React.RefObject<EditorView | null>,
  setLocalStorageInput: React.Dispatch<React.SetStateAction<EditorContent>>,
) {
  if (!editorRef.current) return;

  const content = editorRef.current.state.doc.toString();

  setLocalStorageInput((prev) => ({
    ...prev,
    content,
  }));
}
