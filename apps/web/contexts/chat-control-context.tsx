"use client";

import { chatModels } from "@workspace/api-routes/providers/models";
import React, {
  createContext,
  type ReactNode,
  useContext,
  useState,
} from "react";

interface ChatModel {
  id: number;
  name: string;
  label: string;
  description: string;
  images: boolean;
  pdfs: boolean;
  reasoning: boolean;
}

interface ChatControlContextType {
  selectedChatModel: ChatModel;
  setSelectedChatModel: React.Dispatch<React.SetStateAction<ChatModel>>;
  isTemporary: boolean;
  setIsTemporary: React.Dispatch<React.SetStateAction<boolean>>;
  reasoningEnabled: boolean;
  setReasoningEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  webSearchEnabled: boolean;
  setWebSearchEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

const ChatControlContext = createContext<ChatControlContextType | undefined>(
  undefined,
);

interface Props {
  children: ReactNode;
}

export function ChatControlProvider({ children }: Props) {
  const [selectedChatModel, setSelectedChatModel] = useState<ChatModel>(() => {
    if (!chatModels[0]) {
      throw new Error("No default chat models found.");
    }
    return chatModels[0];
  });
  const [isTemporary, setIsTemporary] = useState(false);
  const [reasoningEnabled, setReasoningEnabled] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);

  return (
    <ChatControlContext.Provider
      value={{
        selectedChatModel,
        setSelectedChatModel,
        isTemporary,
        setIsTemporary,
        reasoningEnabled,
        setReasoningEnabled,
        webSearchEnabled,
        setWebSearchEnabled,
      }}
    >
      {children}
    </ChatControlContext.Provider>
  );
}

export function useChatControl(): ChatControlContextType {
  const context = useContext(ChatControlContext);
  if (!context) {
    throw new Error("useChatControl must be used within a ChatControlProvider");
  }
  return context;
}
