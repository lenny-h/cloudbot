"use client";

import { type EditorState as CodeEditorState } from "@codemirror/state";
import { type EditorState as TextEditorState } from "prosemirror-state";
import {
  createContext,
  type ReactNode,
  type RefObject,
  useContext,
  useRef,
  useState,
} from "react";

type DiffContextType = {
  textDiffPrev: RefObject<TextEditorState | undefined>;
  codeDiffPrev: RefObject<CodeEditorState | undefined>;
  textStreamBuffer: RefObject<string>;
  codeStreamBuffer: RefObject<string>;
  currentDiffId: string | null;
  setCurrentDiffId: React.Dispatch<React.SetStateAction<string | null>>;
  isViewingVersion: boolean;
  setIsViewingVersion: React.Dispatch<React.SetStateAction<boolean>>;
  isBlocked: boolean;
};

const DiffContext = createContext<DiffContextType | undefined>(undefined);

interface Props {
  children: ReactNode;
}

export function DiffProvider({ children }: Props) {
  const textDiffPrev = useRef<TextEditorState | undefined>(undefined);
  const codeDiffPrev = useRef<CodeEditorState | undefined>(undefined);
  const textStreamBuffer = useRef<string>("");
  const codeStreamBuffer = useRef<string>("");
  const [currentDiffId, setCurrentDiffId] = useState<string | null>(null);
  const [isViewingVersion, setIsViewingVersion] = useState(false);

  const isBlocked =
    textDiffPrev.current !== undefined ||
    codeDiffPrev.current !== undefined ||
    isViewingVersion;

  return (
    <DiffContext.Provider
      value={{
        textDiffPrev,
        codeDiffPrev,
        textStreamBuffer,
        codeStreamBuffer,
        currentDiffId,
        setCurrentDiffId,
        isViewingVersion,
        setIsViewingVersion,
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
