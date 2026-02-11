"use client";

import { useDiff } from "@/contexts/diff-context";
import { useEditor } from "@/contexts/editor-context";
import { useRefs } from "@/contexts/refs-context";
import { useQueryClient } from "@tanstack/react-query";
import { type CustomUIDataTypes } from "@workspace/api-routes/types/custom-ui-data-types";
import { type DataUIPart } from "ai";
import { useEffect } from "react";
import { appendContentToEditor } from "../editors/helper-functions/append-content-to-editor";
import { clearEditor } from "../editors/helper-functions/clear-editor";
import { disableEditor } from "../editors/helper-functions/disable-editor";
import { finishDocumentCreation } from "../editors/helper-functions/finish-document-creation";
import { finishDocumentUpdate } from "../editors/helper-functions/finish-document-update";

export function DataStreamHandler({
  dataStream,
  setDataStream,
}: {
  dataStream: DataUIPart<CustomUIDataTypes>[];
  setDataStream: (stream: DataUIPart<CustomUIDataTypes>[]) => void;
}) {
  const queryClient = useQueryClient();
  const { editorMode, setEditorMode, setDocumentIdentifier } = useEditor();
  const { textEditorRef, codeEditorRef } = useRefs();
  const { textDiffPrev, setTextDiffNext, codeDiffPrev, setCodeDiffNext } =
    useDiff();

  useEffect(() => {
    if (!dataStream?.length) {
      return;
    }

    const newDeltas = dataStream.slice();
    setDataStream([]);

    for (const delta of newDeltas) {
      switch (delta.type) {
        case "data-chatCreated":
          queryClient.invalidateQueries({ queryKey: ["chats"] });
          queryClient.invalidateQueries({
            queryKey: ["chatTitle", delta.data.chatId],
          });
          break;

        case "data-documentIdentifier":
          const { id, title, kind } = delta.data;

          setEditorMode(kind);

          switch (kind) {
            case "text":
              if (!textEditorRef.current) {
                console.warn(
                  "Text editor reference is null when processing document identifier.",
                );
                return;
              }

              textDiffPrev.current = textEditorRef.current.state;
              break;
            case "code":
              if (!codeEditorRef.current) {
                console.warn(
                  "Code editor reference is null when processing document identifier.",
                );
                return;
              }

              codeDiffPrev.current = codeEditorRef.current.state;
              break;
            default:
              break;
          }

          // Disable editor while streaming
          disableEditor(editorMode, textEditorRef, codeEditorRef);
          // Clear editor
          clearEditor(editorMode, textEditorRef, codeEditorRef);

          setDocumentIdentifier({ id, title });
          break;

        case "data-textDelta":
          // If there's no previous state, dont append deltas
          if (!textDiffPrev.current) {
            return;
          }

          appendContentToEditor("text", textEditorRef, delta.data);
          break;

        case "data-codeDelta":
          // If there's no previous state, dont append deltas
          if (!codeDiffPrev.current) {
            return;
          }

          appendContentToEditor("code", codeEditorRef, delta.data);
          break;

        // case "data-sheetDelta": // Maybe add sheet later
        //   break;

        case "data-createFinish":
          // Stream finished

          finishDocumentCreation({
            editorMode,
            textDiffPrev,
            textEditorRef,
            codeDiffPrev,
            codeEditorRef,
          });

          break;

        case "data-updateFinish":
          // Stream finished

          finishDocumentUpdate({
            editorMode,
            textDiffPrev,
            textEditorRef,
            setTextDiffNext,
            codeDiffPrev,
            codeEditorRef,
            setCodeDiffNext,
          });
          break;

        case "data-fileGenerating":
          // Handle file generation notification
          console.log("File generation in progress:", delta.data);
          break;

        case "data-fileGenerated":
          // Handle file generation completion
          console.log("File generated:", delta.data);
          break;

        default:
          break;
      }
    }
  }, [
    dataStream,
    setDataStream,
    editorMode,
    setEditorMode,
    textEditorRef,
    codeEditorRef,
    textDiffPrev,
    setTextDiffNext,
    codeDiffPrev,
    setCodeDiffNext,
  ]);

  return null;
}
