import { type EditorMode } from "@/contexts/editor-context";
import { type EditorState as CodeMirrorEditorState } from "@codemirror/state";
import { type EditorView as CodeMirrorEditorView } from "@codemirror/view";
import { type EditorState as ProseMirrorEditorState } from "prosemirror-state";
import { type EditorView as ProseMirrorEditorView } from "prosemirror-view";
import { type RefObject } from "react";
import { disableEditor } from "./disable-editor";
import { updateEditorWithDispatch } from "./update-editor-with-dispatch";

interface LoadVersionContentParams {
  editorMode: EditorMode;
  textDiffPrev: RefObject<ProseMirrorEditorState | undefined>;
  textEditorRef: RefObject<ProseMirrorEditorView | null>;
  codeDiffPrev: RefObject<CodeMirrorEditorState | undefined>;
  codeEditorRef: RefObject<CodeMirrorEditorView | null>;
  versionContent: string;
}

export async function loadVersionContent({
  editorMode,
  textDiffPrev,
  textEditorRef,
  codeDiffPrev,
  codeEditorRef,
  versionContent,
}: LoadVersionContentParams): Promise<void> {
  switch (editorMode) {
    case "text": {
      if (!textEditorRef.current) return;

      // Store current editor state
      textDiffPrev.current = textEditorRef.current.state;

      // Disable editor
      disableEditor("text", textEditorRef, codeEditorRef);

      // Update editor with version content
      updateEditorWithDispatch("text", textEditorRef, versionContent);
      break;
    }

    case "code": {
      if (!codeEditorRef.current) return;

      // Store current editor state
      codeDiffPrev.current = codeEditorRef.current.state;

      // Disable editor
      disableEditor("code", textEditorRef, codeEditorRef);

      // Update editor with version content
      updateEditorWithDispatch("code", codeEditorRef, versionContent);
      break;
    }
  }
}
