import { type EditorView } from "@codemirror/view";

export function appendContentToCodeEditor(
  editorRef: React.RefObject<EditorView | null>,
  contentToAppend: string,
) {
  if (!editorRef.current) return;

  editorRef.current.dispatch({
    changes: {
      from: editorRef.current.state.doc.length,
      to: editorRef.current.state.doc.length,
      insert: contentToAppend,
    },
  });
}
