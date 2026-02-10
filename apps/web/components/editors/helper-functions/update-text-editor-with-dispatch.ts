import { type EditorView } from "prosemirror-view";
import { buildDocumentFromContent } from "./build-document-from-content";

export function updateTextEditorWithDispatch(
  editorRef: React.RefObject<EditorView | null>,
  content: string,
) {
  if (!editorRef.current) return;

  const newDoc = buildDocumentFromContent(content);
  const tr = editorRef.current.state.tr.replaceWith(
    0,
    editorRef.current.state.doc.content.size,
    newDoc.content,
  );
  editorRef.current.dispatch(tr);
}
