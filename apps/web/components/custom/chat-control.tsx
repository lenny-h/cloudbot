import React, { type ChangeEvent } from "react";
import { ChatControlsDropdown } from "./chat-control-dropdown";
import { MicrophoneButton } from "./microphone-button";
import { ModelSelector } from "./model-selector";
import { SendButton } from "./send-button";
import { StopButton } from "./stop-button";

interface TextAreaControlProps {
  input: string;
  uploadQueue: Array<string>;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onScreenshotCapture: (file: File) => void;
  onVoiceInput: (text: string) => void;
  submitForm: () => void;
  isLoading: boolean;
  stop: () => void;
}

export const TextAreaControl: React.FC<TextAreaControlProps> = ({
  input,
  uploadQueue,
  onFileChange,
  onScreenshotCapture,
  onVoiceInput,
  submitForm,
  isLoading,
  stop,
}) => {
  return (
    <div className="flex items-center justify-between gap-2 px-2 pb-2">
      <div className="flex items-center">
        <ChatControlsDropdown
          isLoading={isLoading}
          onFileChange={onFileChange}
          onScreenshotCapture={onScreenshotCapture}
        />
      </div>

      <div className="flex items-center space-x-2">
        <ModelSelector />
        <MicrophoneButton isLoading={isLoading} onTranscript={onVoiceInput} />
        {isLoading ? (
          <StopButton stop={stop} />
        ) : (
          <SendButton
            input={input}
            submitForm={submitForm}
            uploadQueue={uploadQueue}
          />
        )}
      </div>
    </div>
  );
};
