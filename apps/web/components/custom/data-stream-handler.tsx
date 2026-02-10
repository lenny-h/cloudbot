"use client";

import { useDiff } from "@/contexts/diff-context";
import { useEditor } from "@/contexts/editor-context";
import { useRefs } from "@/contexts/refs-context";
import { type CustomUIDataTypes } from "@workspace/api-routes/types/custom-ui-data-types";
import { type DataUIPart } from "ai";
import { useEffect } from "react";

export function DataStreamHandler({
  dataStream,
  setDataStream,
}: {
  dataStream: DataUIPart<CustomUIDataTypes>[];
  setDataStream: (stream: DataUIPart<CustomUIDataTypes>[]) => void;
}) {
  const { editorMode, setEditorMode } = useEditor();
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
        case "data-id":
          break;

        case "data-title":
          break;

        case "data-kind":
          break;

        case "data-textDelta":
          break;

        case "data-codeDelta":
          break;

        case "data-sheetDelta":
          break;

        case "data-clear":
          // Clear editors

          break;

        case "data-finish":
          // Stream finished
          break;

        case "data-fileGenerating":
          // Handle file generation notification
          break;

        case "data-fileGenerated":
          // Handle file generation completion
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
