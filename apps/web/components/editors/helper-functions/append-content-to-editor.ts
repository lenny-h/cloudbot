import { type EditorMode } from "@/contexts/editor-context";
import { type EditorView as CodeMirrorEditorView } from "@codemirror/view";
import { type EditorView as ProseMirrorEditorView } from "prosemirror-view";
import { buildDocumentFromContent } from "./build-document-from-content";

export function appendContentToEditor(
  editorMode: EditorMode,
  editorRef: React.RefObject<
    CodeMirrorEditorView | ProseMirrorEditorView | null
  >,
  contentToAppend: string,
) {
  if (!editorRef.current) return;

  switch (editorMode) {
    case "text": {
      const editor = editorRef.current as ProseMirrorEditorView;
      const newDoc = buildDocumentFromContent(contentToAppend);
      const tr = editor.state.tr.insert(
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
          from: editor.state.doc.length,
          to: editor.state.doc.length,
          insert: contentToAppend,
        },
      });
      break;
    }
  }
}
