"use client";

import { useDataStream } from "@/contexts/data-stream-context";
import { useDiff } from "@/contexts/diff-context";
import { useEditor } from "@/contexts/editor-context";
import { useRefs } from "@/contexts/refs-context";
import { resizeEditor } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { appendContentToEditor } from "../editors/helper-functions/append-content-to-editor";
import { clearEditor } from "../editors/helper-functions/clear-editor";
import { disableEditor } from "../editors/helper-functions/disable-editor";
import { finishDocumentCreation } from "../editors/helper-functions/finish-document-creation";
import { finishDocumentUpdate } from "../editors/helper-functions/finish-document-update";

export function DataStreamHandler() {
  const { dataStream, setDataStream } = useDataStream();
  const queryClient = useQueryClient();
  const {
    editorMode,
    setEditorMode,
    setTextDocumentIdentifier,
    setCodeDocumentIdentifier,
  } = useEditor();
  const { panelRef, textEditorRef, codeEditorRef } = useRefs();
  const {
    textDiffPrev,
    codeDiffPrev,
    textStreamBuffer,
    codeStreamBuffer,
    setCurrentDiffId,
  } = useDiff();

  useEffect(() => {
    if (!dataStream?.length) {
      return;
    }

    const newDeltas = dataStream.slice();
    setDataStream([]);

    for (const delta of newDeltas) {
      switch (delta.type) {
        case "data-chatCreated":
          console.log("Chat created with ID:", delta.data.chatId);

          queryClient.invalidateQueries({ queryKey: ["chats"] });
          queryClient.invalidateQueries({
            queryKey: ["chatTitle", delta.data.chatId],
          });
          break;

        case "data-documentIdentifier":
          console.log("Received document identifier:", delta.data);

          const { id, title, kind } = delta.data;

          setEditorMode(kind);
          resizeEditor(panelRef, false);

          switch (kind) {
            case "text":
              if (!textEditorRef.current) {
                console.warn(
                  "Text editor reference is null when processing document identifier.",
                );
                return;
              }

              textDiffPrev.current = textEditorRef.current.state;
              textStreamBuffer.current = "";
              break;
            case "code":
              if (!codeEditorRef.current) {
                console.warn(
                  "Code editor reference is null when processing document identifier.",
                );
                return;
              }

              codeDiffPrev.current = codeEditorRef.current.state;
              codeStreamBuffer.current = "";
              break;
          }

          // Disable editor while streaming
          disableEditor(editorMode, textEditorRef, codeEditorRef);
          // Clear editor
          clearEditor(editorMode, textEditorRef, codeEditorRef);

          switch (kind) {
            case "text":
              setTextDocumentIdentifier({ id, title });
              break;
            case "code":
              setCodeDocumentIdentifier({ id, title });
              break;
          }

          break;

        case "data-textDelta":
          // If there's no previous state, dont append deltas
          if (!textDiffPrev.current) {
            return;
          }

          appendContentToEditor(
            "text",
            textEditorRef,
            delta.data,
            textStreamBuffer,
          );
          break;

        case "data-codeDelta":
          // If there's no previous state, dont append deltas
          if (!codeDiffPrev.current) {
            return;
          }

          appendContentToEditor(
            "code",
            codeEditorRef,
            delta.data,
            codeStreamBuffer,
          );
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
          textStreamBuffer.current = "";
          codeStreamBuffer.current = "";

          break;

        case "data-updateFinish":
          // Stream finished
          const { diffId } = delta.data;

          finishDocumentUpdate({
            editorMode,
            textDiffPrev,
            textEditorRef,
            codeDiffPrev,
            codeEditorRef,
            textStreamBuffer,
            codeStreamBuffer,
          });

          // Show diff actions
          setCurrentDiffId(diffId);

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
    codeDiffPrev,
  ]);

  return null;
}
