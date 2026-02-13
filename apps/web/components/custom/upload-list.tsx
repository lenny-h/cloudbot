import { type Upload } from "@/types/upload";
import { cn } from "@workspace/ui/lib/utils";
import { CircleCheck, CircleX, FileUp, Loader2 } from "lucide-react";
import { memo } from "react";

export const UploadList = memo(
  ({ uploads }: { uploads: { [key: string]: Upload } }) => (
    <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-3">
      {Object.values(uploads).map((upload) => (
        <div
          key={upload.id}
          className={cn(
            "flex items-center gap-3 rounded-lg border p-2.5 transition-colors",
            {
              "bg-green-500/10 border-green-500/20":
                upload.state === "success",
              "bg-red-500/10 border-red-500/20": upload.state === "failure",
              "bg-blue-500/10 border-blue-500/20":
                upload.state === "uploading",
            },
          )}
        >
          <FileUp className="text-muted-foreground size-4 shrink-0" />
          <div className="flex flex-1 flex-col gap-1 overflow-hidden">
            <p className="truncate text-sm font-medium">{upload.name}</p>
            {upload.state === "uploading" ? (
              <div className="flex items-center gap-2">
                <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${upload.progress ?? 0}%` }}
                  />
                </div>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {upload.progress}%
                </span>
              </div>
            ) : upload.state === "success" ? (
              <p className="text-xs text-emerald-500 dark:text-emerald-400">
                Uploaded successfully
              </p>
            ) : (
              <p className="text-xs text-red-500 dark:text-red-400">
                {upload.error ?? "Upload failed"}
              </p>
            )}
          </div>
          {upload.state === "uploading" ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-blue-500" />
          ) : upload.state === "success" ? (
            <CircleCheck className="size-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
          ) : (
            <CircleX className="size-4 shrink-0 text-red-500 dark:text-red-400" />
          )}
        </div>
      ))}
    </div>
  ),
);
