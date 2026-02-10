"use client";

import { useChatControl } from "@/contexts/chat-control-context";
import { useWebTranslations } from "@/contexts/web-translations";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Switch } from "@workspace/ui/components/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import { Brain, Camera, Globe, Paperclip, Plus } from "lucide-react";
import { memo, useRef, useState, type ChangeEvent } from "react";

interface ChatControlsDropdownProps {
  isLoading: boolean;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onScreenshotCapture: (file: File) => void;
}

const PureChatControlsDropdown = ({
  isLoading,
  onFileChange,
  onScreenshotCapture,
}: ChatControlsDropdownProps) => {
  const { webT } = useWebTranslations();
  const {
    selectedChatModel,
    reasoningEnabled,
    setReasoningEnabled,
    webSearchEnabled,
    setWebSearchEnabled,
  } = useChatControl();

  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAcceptedFileTypes = () => {
    const types = [];
    if (selectedChatModel.images) {
      types.push(".jpeg", ".jpg", ".png");
    }
    if (selectedChatModel.pdfs) {
      types.push(".pdf");
    }
    return types.join(",");
  };

  const handleScreenshot = async () => {
    setOpen(false);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0);

      stream.getTracks().forEach((track) => track.stop());

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `screenshot-${Date.now()}.png`, {
            type: "image/png",
          });
          onScreenshotCapture(file);
        }
      }, "image/png");
    } catch {
      // User cancelled the screenshot
    }
  };

  const activeCount =
    (reasoningEnabled && selectedChatModel.reasoning ? 1 : 0) +
    (webSearchEnabled ? 1 : 0);

  return (
    <>
      <input
        accept={getAcceptedFileTypes()}
        aria-label="Attach files"
        className="sr-only"
        max={3}
        multiple
        onChange={onFileChange}
        ref={fileInputRef}
        tabIndex={-1}
        type="file"
      />

      <DropdownMenu open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-xl"
                disabled={isLoading}
              >
                <Plus size={18} />
                {activeCount > 0 && (
                  <span className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full text-[10px] font-medium">
                    {activeCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>Tools</TooltipContent>
        </Tooltip>

        <DropdownMenuContent align="start" side="top" className="w-56">
          {/* Attachments */}
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              fileInputRef.current?.click();
              setOpen(false);
            }}
          >
            <Paperclip className="mr-2 size-4" />
            {webT.multimodal.attachFiles}
          </DropdownMenuItem>

          {/* Screenshot */}
          <DropdownMenuItem onSelect={handleScreenshot}>
            <Camera className="mr-2 size-4" />
            {webT.multimodal.captureScreenshot}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Reasoning toggle */}
          <DropdownMenuItem
            disabled={!selectedChatModel.reasoning}
            onSelect={(e) => {
              e.preventDefault();
              setReasoningEnabled((prev) => !prev);
            }}
            className="flex cursor-pointer justify-between"
          >
            <div className="flex items-center">
              <Brain
                className={cn(
                  "mr-2 size-4",
                  reasoningEnabled &&
                    selectedChatModel.reasoning &&
                    "text-primary",
                )}
              />
              <span>{webT.reasoningButton.reasoning}</span>
            </div>
            <Switch
              className="cursor-pointer"
              checked={reasoningEnabled && selectedChatModel.reasoning}
              onCheckedChange={setReasoningEnabled}
              disabled={!selectedChatModel.reasoning}
            />
          </DropdownMenuItem>

          {/* Web Search toggle */}
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setWebSearchEnabled((prev) => !prev);
            }}
            className="flex cursor-pointer justify-between"
          >
            <div className="flex items-center">
              <Globe
                className={cn(
                  "mr-2 size-4",
                  webSearchEnabled && "text-primary",
                )}
              />
              <span>{webT.multimodal.webSearch}</span>
            </div>
            <Switch
              className="cursor-pointer"
              checked={webSearchEnabled}
              onCheckedChange={setWebSearchEnabled}
            />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export const ChatControlsDropdown = memo(PureChatControlsDropdown);
