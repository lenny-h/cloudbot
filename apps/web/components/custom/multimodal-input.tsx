"use client";

import { useChatControl } from "@/contexts/chat-control-context";
import { useFilter } from "@/contexts/filter-context";
import { useWebTranslations } from "@/contexts/web-translations";
import { useFileUpload } from "@/hooks/use-file-upload";
import { minimizeFilter } from "@/lib/utils";
import { type Attachment } from "@workspace/api-routes/schemas/attachment-schema";
import { type CustomUIMessage } from "@workspace/api-routes/types/custom-ui-message";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { cn, generateUUID } from "@workspace/ui/lib/utils";
import { type ChatRequestOptions } from "ai";
import React, {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useLocalStorage } from "usehooks-ts";
import {
  Attachment as AttachmentComponent,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "../ai-elements/attachments";
import { ContextFiles } from "./context-files";
import { Textarea } from "./text-area";
import { TextAreaControl } from "./text-area-control";

interface MultimodalInputProps {
  sendMessage: (
    message: CustomUIMessage,
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<void>;
  chatId: string;
  input: string;
  setInput: (value: string) => void;
  status: "error" | "ready" | "submitted" | "streaming";
  stop: () => void;
}

const PureMultimodalInput = ({
  sendMessage,
  chatId,
  input,
  setInput,
  status,
  stop,
}: MultimodalInputProps) => {
  const { locale } = useSharedTranslations();
  const { webT } = useWebTranslations();
  const { filter } = useFilter();
  const { selectedChatModel, isTemporary, reasoningEnabled, webSearchEnabled } =
    useChatControl();
  const { uploadQueue, handleFileChange, handleFilesUpload } = useFileUpload();
  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    "input",
    "",
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const attachmentsRef = useRef<Attachment[]>([]);

  const isLoading = status === "submitted" || status === "streaming";

  // Keep ref in sync with state for cleanup on unmount
  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  // Cleanup blob URLs only on unmount
  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach((attachment) => {
        if (attachment.previewUrl) {
          URL.revokeObjectURL(attachment.previewUrl);
        }
      });
    };
  }, []);

  // Restore input from localStorage on mount
  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      setInput(domValue || localStorageInput || "");
    }
  }, []);

  // Persist input in localStorage whenever it changes
  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleRemoveAttachment = useCallback((index: number) => {
    setAttachments((prev) => {
      const removed = prev[index];
      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleVoiceInput = useCallback(
    (transcript: string) => {
      const newValue = input ? input + transcript : transcript;
      setInput(newValue);
      textareaRef.current?.focus();
    },
    [input, setInput],
  );

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }

    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Create a synthetic event to reuse the existing onFileChange handler
      const fileList = e.dataTransfer.files;
      const event = {
        target: {
          files: fileList,
        },
      } as ChangeEvent<HTMLInputElement>;

      handleFileChange(event, setAttachments);
    }
  };

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];

      for (const item of items) {
        if (item.type.startsWith("image/") || item.type === "application/pdf") {
          const file = item.getAsFile();
          if (file) {
            // Generate a filename for pasted files
            const extension = item.type.split("/")[1];

            if (!extension) continue;

            const prefix =
              item.type === "application/pdf"
                ? "pasted-document"
                : "pasted-image";
            const timestamp = Date.now();

            const namedFile = new File(
              [file],
              `${prefix}-${timestamp}.${extension}`,
              { type: file.type },
            );
            files.push(namedFile);
          }
        }
      }

      if (files.length > 0) {
        e.preventDefault();
        handleFilesUpload(files, setAttachments);
      }
    },
    [handleFilesUpload],
  );

  const handleScreenshotCapture = useCallback(
    (file: File) => {
      handleFilesUpload([file], setAttachments);
    },
    [handleFilesUpload],
  );

  const submitForm = useCallback(() => {
    window.history.replaceState({}, "", `/${locale}/chat/${chatId}`);

    sendMessage(
      {
        id: generateUUID(),
        role: "user",
        parts: [{ type: "text", text: input }],
        metadata: {
          attachments: attachments.map(({ filename, mediaType }) => ({
            filename,
            mediaType,
          })),
          contextFilter: minimizeFilter(filter),
        },
      },
      {
        body: {
          modelIdx: selectedChatModel.id,
          temporary: isTemporary,
          reasoning: selectedChatModel.reasoning && reasoningEnabled,
          webSearch: webSearchEnabled,
        },
      },
    );

    setInput("");
    // Cleanup blob URLs before clearing attachments
    attachments.forEach((attachment) => {
      if (attachment.previewUrl) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
    });
    setAttachments([]);

    textareaRef.current?.focus();
  }, [
    filter,
    locale,
    chatId,
    input,
    attachments,
    selectedChatModel,
    isTemporary,
    reasoningEnabled,
    webSearchEnabled,
  ]);

  return (
    <div
      className={cn(
        "relative w-full rounded-2xl border-t shadow-[0_-5px_10px_-10px] sm:border sm:shadow-xl",
        isTemporary
          ? "bg-foreground/85 text-background"
          : "bg-background text-foreground",
      )}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="border-primary/50 bg-background/80 absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed">
          <span className="text-muted-foreground text-sm">
            {webT.multimodal.dropFiles}
          </span>
        </div>
      )}

      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div className="flex flex-row items-end gap-2 overflow-x-scroll border-b p-1">
          <Attachments variant="grid">
            {attachments.map((attachment, index) => (
              <AttachmentComponent
                key={index}
                data={{
                  id: `attachment-${index}`,
                  type: "file",
                  filename: attachment.filename,
                  mediaType: attachment.mediaType,
                  url: attachment.previewUrl,
                }}
                onRemove={() => handleRemoveAttachment(index)}
              >
                <AttachmentPreview />
                <AttachmentRemove />
              </AttachmentComponent>
            ))}

            {uploadQueue.map((filename, index) => (
              <AttachmentComponent
                key={filename}
                data={{
                  id: `uploading-${index}`,
                  type: "file",
                  filename,
                  mediaType: "",
                }}
              >
                <AttachmentPreview />
              </AttachmentComponent>
            ))}
          </Attachments>
        </div>
      )}

      <ContextFiles />

      <Textarea
        textareaRef={textareaRef}
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        submitForm={submitForm}
        onPaste={handlePaste}
      />
      <TextAreaControl
        input={input}
        uploadQueue={uploadQueue}
        onFileChange={(event: ChangeEvent<HTMLInputElement>) => {
          handleFileChange(event, setAttachments);
        }}
        onScreenshotCapture={handleScreenshotCapture}
        onVoiceInput={handleVoiceInput}
        submitForm={submitForm}
        isLoading={isLoading}
        stop={stop}
      />
    </div>
  );
};

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.status !== nextProps.status) return false;

    return true;
  },
);
