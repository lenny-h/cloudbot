"use client";

import { useDiff } from "@/contexts/diff-context";
import { useEditor } from "@/contexts/editor-context";
import { type ContextFilter, useFilter } from "@/contexts/filter-context";
import { useRefs } from "@/contexts/refs-context";
import { useWebTranslations } from "@/contexts/web-translations";
import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { type CustomUIMessage } from "@workspace/api-routes/types/custom-ui-message";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { generateUUID } from "@workspace/ui/lib/utils";
import { DefaultChatTransport } from "ai";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocalStorage } from "usehooks-ts";
import { type EditorContent } from "../editors/main/text-editor";
import { ChatHeader } from "./chat-header";
import { Greeting } from "./greeting";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";

export function Chat({
  chatId,
  initialMessages,
}: {
  chatId: string;
  initialMessages: Array<CustomUIMessage>;
}) {
  const { sharedT } = useSharedTranslations();
  const { webT } = useWebTranslations();
  const queryClient = useQueryClient();
  const { panelRef, textEditorRef, codeEditorRef } = useRefs();
  const { textDiffPrev, setTextDiffNext, codeDiffPrev, setCodeDiffNext } =
    useDiff();

  const { setFilter } = useFilter();
  const [editorMode, setEditorMode] = useEditor();

  const [input, setInput] = useState("");

  const [localTextEditorContent, setLocalTextEditorContent] =
    useLocalStorage<EditorContent>("text-editor-input", {
      id: undefined,
      title: "",
      content: "",
    });
  const [localCodeEditorContent, setLocalCodeEditorContent] =
    useLocalStorage<EditorContent>("text-editor-input", {
      id: undefined,
      title: "",
      content: "",
    });

  // Fetch and set filter from last message metadata if it exists
  useEffect(() => {
    if (initialMessages.length > 0) {
      apiFetcher(
        (client) =>
          client["filter"][":chatId"].$get({
            param: { chatId },
          }),
        sharedT.apiCodes,
      )
        .then((response) => {
          const contextFilter = response as ContextFilter;
          setFilter(contextFilter);
        })
        .catch((error) => {
          console.error("Failed to fetch filter:", error);
        });
    }
  }, [chatId, initialMessages.length]);

  const { sendMessage, messages, setMessages, status, stop, regenerate } =
    useChat<CustomUIMessage>({
      id: chatId,
      messages: initialMessages,
      generateId: generateUUID,
      experimental_throttle: 100,
      // onData: (dataPart) => {}, // TODO
      onError: () => toast.error(webT.chat.errorOccurred),
      transport: new DefaultChatTransport({
        api: `${process.env.NEXT_PUBLIC_API_URL}/api/protected/chat`,
        credentials: "include",
        prepareSendMessagesRequest({ body, messages }) {
          return {
            body: {
              id: chatId,
              message: messages[messages.length - 1],
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              ...body,
            },
          };
        },
      }),
    });

  return (
    <>
      <div className="flex h-dvh flex-col">
        <ChatHeader
          chatId={chatId}
          isEmpty={messages.length === 0}
          isLoading={status === "submitted" || status === "streaming"}
          isNewChat={messages.length < 2}
        />

        {messages.length === 0 ? (
          <Greeting />
        ) : (
          <Messages
            chatId={chatId}
            messages={messages}
            setMessages={setMessages}
            status={status}
            regenerate={regenerate}
          />
        )}

        <form className="mx-auto w-full -translate-y-1 sm:px-4 sm:pb-4 md:max-w-3xl md:px-6 md:pb-6">
          <MultimodalInput
            sendMessage={sendMessage}
            chatId={chatId}
            input={input}
            setInput={setInput}
            status={status}
            stop={stop}
          />
        </form>
      </div>
    </>
  );
}
