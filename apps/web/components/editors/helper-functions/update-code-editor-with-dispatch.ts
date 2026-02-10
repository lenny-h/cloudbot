import { type EditorView } from "@codemirror/view";

export function updateCodeEditorWithDispatch(
  editorRef: React.RefObject<EditorView | null>,
  newContent: string,
) {
  if (!editorRef.current) return;

  editorRef.current.dispatch({
    changes: {
      from: 0,
      to: editorRef.current.state.doc.length,
      insert: newContent,
    },
  });
}
