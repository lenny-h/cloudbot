import { type EditorMode } from "@/contexts/editor-context";
import { type EditorState as CodeMirrorEditorState } from "@codemirror/state";
import { type EditorView as CodeMirrorEditorView } from "@codemirror/view";
import { type EditorState as ProseMirrorEditorState } from "prosemirror-state";
import { type EditorView as ProseMirrorEditorView } from "prosemirror-view";
import { type RefObject } from "react";
import { createDiffViewString } from "./create-diff-view-string";
import { updateEditorWithDispatch } from "./update-editor-with-dispatch";

export async function finishDocumentUpdate({
  editorMode,
  textDiffPrev,
  textEditorRef,
  codeDiffPrev,
  codeEditorRef,
}: {
  editorMode: EditorMode;
  textDiffPrev: RefObject<ProseMirrorEditorState | undefined>;
  textEditorRef: RefObject<ProseMirrorEditorView | null>;
  codeDiffPrev: RefObject<CodeMirrorEditorState | undefined>;
  codeEditorRef: RefObject<CodeMirrorEditorView | null>;
}) {
  switch (editorMode) {
    case "text": {
      if (!textDiffPrev.current || !textEditorRef.current) {
        console.warn(
          "Text editor reference is null when processing finish event.",
        );
        return;
      }

      const { mathMarkdownSerializer } =
        await import("../prosemirror-math/utils/text-serializer");
      const { diffSentences } =
        await import("@/components/editors/jsdiff/sentence");

      const prevContent = mathMarkdownSerializer.serialize(
        textDiffPrev.current.doc,
      );
      const content = mathMarkdownSerializer.serialize(
        textEditorRef.current.state.doc,
      );

      const textDiffResult = diffSentences(prevContent, content);

      updateEditorWithDispatch(
        "text",
        textEditorRef,
        createDiffViewString(textDiffResult, true),
      );

      break;
    }
    case "code": {
      if (!codeDiffPrev.current || !codeEditorRef.current) {
        console.warn(
          "Code editor reference is null when processing finish event.",
        );
        return;
      }

      const prevContent = codeDiffPrev.current.doc.toString();
      const content = codeEditorRef.current.state.doc.toString();

      const { diffLines } = await import("@/components/editors/jsdiff/line");

      const codeDiffResult = diffLines(prevContent, content);

      console.log("Previous content:", prevContent);
      console.log("Current content:", content);
      console.log("Code diff result:", codeDiffResult);

      updateEditorWithDispatch(
        "code",
        codeEditorRef,
        createDiffViewString(codeDiffResult, true),
      );

      break;
    }
  }
}
