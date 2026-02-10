import { type EditorContent } from "@/contexts/editor-context";
import { type EditorView } from "prosemirror-view";
import { mathMarkdownSerializer } from "../prosemirror-math/utils/text-serializer";

export function syncTextEditorContentToLocalStorage(
  editorRef: React.RefObject<EditorView | null>,
  setLocalStorageInput: React.Dispatch<React.SetStateAction<EditorContent>>,
) {
  if (!editorRef.current) return;

  const content = mathMarkdownSerializer.serialize(editorRef.current.state.doc);

  setLocalStorageInput((prev) => ({
    ...prev,
    content,
  }));
}
