import { type EditorMode } from "@/contexts/editor-context";
import { type EditorView as CodeMirrorEditorView } from "@codemirror/view";
import { type EditorView as ProseMirrorEditorView } from "prosemirror-view";
import { type RefObject } from "react";
import { mathMarkdownSerializer } from "../prosemirror-math/utils/text-serializer";

interface SerializeEditorContentParams {
  editorMode: EditorMode;
  textEditorRef: RefObject<ProseMirrorEditorView | null>;
  codeEditorRef: RefObject<CodeMirrorEditorView | null>;
}

export function serializeEditorContent({
  editorMode,
  textEditorRef,
  codeEditorRef,
}: SerializeEditorContentParams): string | undefined {
  switch (editorMode) {
    case "text": {
      if (!textEditorRef.current) return undefined;
      return mathMarkdownSerializer.serialize(textEditorRef.current.state.doc);
    }

    case "code": {
      if (!codeEditorRef.current) return undefined;
      return codeEditorRef.current.state.doc.toString();
    }

    default:
      return undefined;
  }
}
