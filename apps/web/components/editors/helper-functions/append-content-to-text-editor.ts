import { type EditorView } from "prosemirror-view";
import { buildDocumentFromContent } from "./build-document-from-content";

export function appendContentToTextEditor(
  editorRef: React.RefObject<EditorView | null>,
  contentToAppend: string,
) {
  if (!editorRef.current) return;

  const newDoc = buildDocumentFromContent(contentToAppend);
  const tr = editorRef.current.state.tr.insert(
    editorRef.current.state.doc.content.size,
    newDoc.content,
  );
  editorRef.current.dispatch(tr);
}
