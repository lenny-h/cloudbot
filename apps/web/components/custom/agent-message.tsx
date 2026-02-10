"use client";

import * as m from "motion/react-m";

import { type CustomUIMessage } from "@workspace/api-routes/types/custom-ui-message";
import { cn } from "@workspace/ui/lib/utils";
import {
  type ChatRequestOptions,
  type SourceDocumentUIPart,
  type SourceUrlUIPart,
} from "ai";
import equal from "fast-deep-equal";
import { LazyMotion } from "motion/react";
import dynamic from "next/dynamic";
import { memo, useMemo } from "react";
import {
  ToolCreateDocument,
  ToolExtractFromDocuments,
  ToolExtractFromWeb,
  ToolGenerateFile,
  ToolSourceDocument,
  ToolSourceUrl,
  ToolUpdateDocument,
} from "../tools";
import { Markdown } from "./markdown";
import { MessageActions } from "./message-actions";
import { StreamingIndicator } from "./streaming-indicator";

const MessageReasoning = dynamic(() =>
  import("./message-reasoning").then((mod) => mod.MessageReasoning),
);

interface AgentMessageProps {
  chatId: string;
  message: CustomUIMessage;
  regenerate: (
    options?: {
      messageId?: string | undefined;
    } & ChatRequestOptions,
  ) => Promise<void>;
  isLoading: boolean;
  isThinking: boolean;
  isLastMessage: boolean;
  previousMessageId: string;
}

const loadFeatures = () => import("@/lib/features").then((res) => res.default);

const PureAgentMessage = ({
  chatId,
  message,
  regenerate,
  isLoading,
  isThinking,
  isLastMessage,
  previousMessageId,
}: AgentMessageProps) => {
  // Parse LaTeX content
  const parseContent = (text: string) => {
    return text
      .replace(/\\\[(.*?)\\\]/gs, "$$$$$1$$$$")
      .replace(/\\\((.*?)\\\)/gs, "$$$1$$");
  };

  // Derive sources and text content from message parts
  const { docSources, webSources, textContent } = useMemo(() => {
    const docs: SourceDocumentUIPart[] = [];
    const webs: SourceUrlUIPart[] = [];
    const texts: string[] = [];

    for (const part of message.parts) {
      if (part.type === "source-document") {
        docs.push(part);
      } else if (part.type === "source-url") {
        webs.push(part);
      } else if (part.type === "text" && part.text.length > 0) {
        texts.push(part.text);
      }
    }

    return {
      docSources: docs,
      webSources: webs,
      textContent: texts.join("\n"),
    };
  }, [message.parts]);

  return (
    <LazyMotion features={loadFeatures}>
      <m.article
        className="mx-auto w-full max-w-183.75"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1, transition: { delay: 0.3 } }}
        data-role={message.role}
      >
        <div
          className={cn(
            !isThinking && "relative flex w-full flex-col gap-4 p-3",
            isLastMessage &&
              "min-h-[calc(100dvh-324px)] md:min-h-[calc(100dvh-332px)]",
          )}
        >
          {isThinking || (isLoading && message.parts.length === 0) ? (
            <StreamingIndicator />
          ) : (
            <>
              {message.parts.map((part, index) => {
                switch (part.type) {
                  case "text": {
                    if (part.text.length === 0) return null;
                    const parsedContent = parseContent(part.text);
                    return (
                      <Markdown
                        key={index}
                        docSources={docSources}
                        webSources={webSources}
                        parseSourceRefs={true}
                      >
                        {parsedContent}
                      </Markdown>
                    );
                  }

                  case "reasoning":
                    return (
                      <MessageReasoning
                        key={index}
                        isLoading={isLoading}
                        reasoning={part.text}
                      />
                    );

                  case "tool-extractFromDocuments":
                    return <ToolExtractFromDocuments key={index} part={part} />;

                  case "tool-extractFromWeb":
                    return <ToolExtractFromWeb key={index} part={part} />;

                  case "source-document":
                    return <ToolSourceDocument key={index} part={part} />;

                  case "source-url":
                    return <ToolSourceUrl key={index} part={part} />;

                  case "tool-createDocument":
                    return <ToolCreateDocument key={index} part={part} />;

                  case "tool-updateDocument":
                    return <ToolUpdateDocument key={index} part={part} />;

                  case "tool-generateFile":
                    return <ToolGenerateFile key={index} part={part} />;

                  default:
                    return null;
                }
              })}

              {textContent && (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <MessageActions
                      chatId={chatId}
                      content={parseContent(textContent)}
                      role={message.role}
                      isLoading={isLoading}
                      regenerate={regenerate}
                      messageId={message.id}
                      previousMessageId={previousMessageId}
                    />

                    {/* Display usage information if available */}
                    {message.metadata?.totalUsage && (
                      <div className="text-muted-foreground flex items-center gap-2 text-sm">
                        <span>
                          Tokens: {message.metadata.totalUsage.totalTokens}
                        </span>
                        {message.metadata.totalUsage.inputTokens &&
                          message.metadata.totalUsage.outputTokens && (
                            <span className="text-muted-foreground">
                              (In: {message.metadata.totalUsage.inputTokens},
                              Out: {message.metadata.totalUsage.outputTokens})
                            </span>
                          )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </m.article>
    </LazyMotion>
  );
};

export const AgentMessage = memo(PureAgentMessage, (prevProps, nextProps) => {
  if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.isThinking !== nextProps.isThinking) return false;
  if (prevProps.isLastMessage !== nextProps.isLastMessage) return false;

  return true;
});
