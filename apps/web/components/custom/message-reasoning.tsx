"use client";

import { useControllableState } from "@radix-ui/react-use-controllable-state";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { cn } from "@workspace/ui/lib/utils";
import { BrainIcon, ChevronDownIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import {
  createContext,
  memo,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Markdown } from "./markdown";

// ---------------------------------------------------------------------------
// Reasoning context
// ---------------------------------------------------------------------------

interface ReasoningContextValue {
  isStreaming: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  duration: number | undefined;
}

const ReasoningContext = createContext<ReasoningContextValue | null>(null);

const useReasoning = () => {
  const context = useContext(ReasoningContext);
  if (!context) {
    throw new Error("Reasoning components must be used within <Reasoning />");
  }
  return context;
};

// ---------------------------------------------------------------------------
// <Reasoning /> – collapsible wrapper
// ---------------------------------------------------------------------------

export type ReasoningProps = ComponentProps<typeof Collapsible> & {
  isStreaming?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  duration?: number;
};

const AUTO_CLOSE_DELAY = 500;
const MS_IN_S = 1000;

const ReasoningRoot = memo(
  ({
    className,
    isStreaming = false,
    open,
    defaultOpen = true,
    onOpenChange,
    duration: durationProp,
    children,
    ...props
  }: ReasoningProps) => {
    const [isOpen, setIsOpen] = useControllableState({
      prop: open,
      defaultProp: defaultOpen,
      onChange: onOpenChange,
    });
    const [duration, setDuration] = useControllableState<number | undefined>({
      prop: durationProp,
      defaultProp: undefined,
    });

    const hasEverStreamedRef = useRef(isStreaming);
    const [hasAutoClosed, setHasAutoClosed] = useState(false);
    const startTimeRef = useRef<number | null>(null);

    // Track streaming start / compute duration
    useEffect(() => {
      if (isStreaming) {
        hasEverStreamedRef.current = true;
        if (startTimeRef.current === null) {
          startTimeRef.current = Date.now();
        }
      } else if (startTimeRef.current !== null) {
        setDuration(Math.ceil((Date.now() - startTimeRef.current) / MS_IN_S));
        startTimeRef.current = null;
      }
    }, [isStreaming, setDuration]);

    // Auto-open when streaming starts
    useEffect(() => {
      if (isStreaming && !isOpen) {
        setIsOpen(true);
      }
    }, [isStreaming, isOpen, setIsOpen]);

    // Auto-close when streaming ends (once)
    useEffect(() => {
      if (
        hasEverStreamedRef.current &&
        !isStreaming &&
        isOpen &&
        !hasAutoClosed
      ) {
        const timer = setTimeout(() => {
          setIsOpen(false);
          setHasAutoClosed(true);
        }, AUTO_CLOSE_DELAY);
        return () => clearTimeout(timer);
      }
    }, [isStreaming, isOpen, setIsOpen, hasAutoClosed]);

    const contextValue = useMemo(
      () => ({ duration, isOpen: isOpen ?? false, isStreaming, setIsOpen }),
      [duration, isOpen, isStreaming, setIsOpen],
    );

    return (
      <ReasoningContext.Provider value={contextValue}>
        <Collapsible
          className={cn("not-prose mb-2", className)}
          onOpenChange={setIsOpen}
          open={isOpen}
          {...props}
        >
          {children}
        </Collapsible>
      </ReasoningContext.Provider>
    );
  },
);
ReasoningRoot.displayName = "Reasoning";

// ---------------------------------------------------------------------------
// <ReasoningTrigger />
// ---------------------------------------------------------------------------

export type ReasoningTriggerProps = ComponentProps<
  typeof CollapsibleTrigger
> & {
  getThinkingMessage?: (isStreaming: boolean, duration?: number) => ReactNode;
};

const defaultGetThinkingMessage = (
  isStreaming: boolean,
  duration?: number,
): ReactNode => {
  if (isStreaming || duration === undefined || duration === 0) {
    return <span className="animate-pulse">Thinking…</span>;
  }
  return <span>Thought for {duration}s</span>;
};

const ReasoningTriggerInner = memo(
  ({
    className,
    children,
    getThinkingMessage = defaultGetThinkingMessage,
    ...props
  }: ReasoningTriggerProps) => {
    const { isStreaming, isOpen, duration } = useReasoning();

    return (
      <CollapsibleTrigger
        className={cn(
          "text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs transition-colors",
          className,
        )}
        {...props}
      >
        {children ?? (
          <>
            <BrainIcon className="size-3.5" />
            {getThinkingMessage(isStreaming, duration)}
            <ChevronDownIcon
              className={cn(
                "size-3 transition-transform",
                isOpen ? "rotate-180" : "rotate-0",
              )}
            />
          </>
        )}
      </CollapsibleTrigger>
    );
  },
);
ReasoningTriggerInner.displayName = "ReasoningTrigger";

// ---------------------------------------------------------------------------
// <ReasoningContent />
// ---------------------------------------------------------------------------

export type ReasoningContentProps = ComponentProps<
  typeof CollapsibleContent
> & {
  children: string;
};

const ReasoningContentInner = memo(
  ({ className, children, ...props }: ReasoningContentProps) => (
    <CollapsibleContent
      className={cn(
        "mt-1.5 text-xs leading-relaxed",
        "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-muted-foreground data-[state=closed]:animate-out data-[state=open]:animate-in outline-none",
        className,
      )}
      {...props}
    >
      <div className="border-border/50 bg-muted/30 max-h-48 overflow-y-auto rounded-md border p-2.5 text-xs [&_li]:my-0 [&_ol]:my-1 [&_p]:my-0 [&_ul]:my-1">
        <Markdown>{children}</Markdown>
      </div>
    </CollapsibleContent>
  ),
);
ReasoningContentInner.displayName = "ReasoningContent";

// ---------------------------------------------------------------------------
// <MessageReasoning /> – convenience wrapper used by agent-message
// ---------------------------------------------------------------------------

interface MessageReasoningProps {
  isLoading: boolean;
  reasoning: string;
}

export const MessageReasoning = memo(
  ({ isLoading, reasoning }: MessageReasoningProps) => {
    return (
      <ReasoningRoot isStreaming={isLoading}>
        <ReasoningTriggerInner />
        <ReasoningContentInner>{reasoning}</ReasoningContentInner>
      </ReasoningRoot>
    );
  },
);
MessageReasoning.displayName = "MessageReasoning";

export {
  ReasoningRoot as Reasoning,
  ReasoningContentInner as ReasoningContent,
  ReasoningTriggerInner as ReasoningTrigger,
};
