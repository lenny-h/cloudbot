"use client";

import { type EditorState as CodeEditorState } from "@codemirror/state";
import { type EditorState as TextEditorState } from "prosemirror-state";
import {
  createContext,
  type ReactNode,
  type RefObject,
  useContext,
  useRef,
} from "react";

type DiffContextType = {
  textDiffPrev: RefObject<TextEditorState | undefined>;
  codeDiffPrev: RefObject<CodeEditorState | undefined>;
  isBlocked: boolean;
};

const DiffContext = createContext<DiffContextType | undefined>(undefined);

interface Props {
  children: ReactNode;
}

export function DiffProvider({ children }: Props) {
  const textDiffPrev = useRef<TextEditorState | undefined>(undefined);
  const codeDiffPrev = useRef<CodeEditorState | undefined>(undefined);

  const isBlocked =
    textDiffPrev.current !== undefined || codeDiffPrev.current !== undefined;

  return (
    <DiffContext.Provider
      value={{
        textDiffPrev,
        codeDiffPrev,
        isBlocked,
      }}
    >
      {children}
    </DiffContext.Provider>
  );
}

export function useDiff(): DiffContextType {
  const context = useContext(DiffContext);
  if (!context) {
    throw new Error("useDiff must be used within a DiffProvider");
  }
  return context;
}
