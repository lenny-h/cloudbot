import { type EditorMode } from "@/contexts/editor-context";
import { type EditorView as CodeMirrorEditorView } from "@codemirror/view";
import { type EditorView as ProseMirrorEditorView } from "prosemirror-view";
import { buildDocumentFromContent } from "./build-document-from-content";

export function updateEditorWithDispatch(
  editorMode: EditorMode,
  editorRef: React.RefObject<
    CodeMirrorEditorView | ProseMirrorEditorView | null
  >,
  newContent: string,
) {
  if (!editorRef.current) return;

  switch (editorMode) {
    case "text": {
      const editor = editorRef.current as ProseMirrorEditorView;
      const newDoc = buildDocumentFromContent(newContent);
      const tr = editor.state.tr.replaceWith(
        0,
        editor.state.doc.content.size,
        newDoc.content,
      );
      editor.dispatch(tr);
      break;
    }
    case "code": {
      const editor = editorRef.current as CodeMirrorEditorView;
      editor.dispatch({
        changes: {
          from: 0,
          to: editor.state.doc.length,
          insert: newContent,
        },
      });
      break;
    }
  }
}
