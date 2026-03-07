import { type Upload } from "@/types/upload";
import { useQueryClient } from "@tanstack/react-query";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { generateUUID } from "@workspace/ui/lib/utils";
import { useState } from "react";
import { useDropzone } from "react-dropzone";

interface Props {
  folderId: string;
}

export function useFolderDropzone({ folderId }: Props) {
  const { sharedT } = useSharedTranslations();
  const queryClient = useQueryClient();
  const [uploads, setUploads] = useState<{ [key: string]: Upload }>({});

  const handleFileUpload = async (file: File) => {
    const id = generateUUID();
    setUploads((prev) => ({
      ...prev,
      [id]: { id, name: file.name, state: "uploading", progress: 0 },
    }));

    try {
      const { signedUrl, fileId } = await apiFetcher(
        (client) =>
          client.files["get-signed-url"][":folderId"].$post({
            param: { folderId },
            json: {
              filename: file.name,
              fileSize: file.size,
              fileType: file.type,
            },
          }),
        sharedT.apiCodes,
      );

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
          const percentCompleted = event.total
            ? Math.round((event.loaded * 100) / event.total)
            : 0;
          setUploads((prev) => ({
            ...prev,
            [id]: { ...prev[id]!, progress: percentCompleted },
          }));
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.response);
          } else {
            reject(
              new Error(`HTTP Error: ${xhr.status} - ${xhr.responseText}`),
            );
          }
        };

        xhr.onerror = () => {
          reject(new Error("Network Error"));
        };

        xhr.open("PUT", signedUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      // Confirm the upload so the file becomes visible
      await apiFetcher(
        (client) =>
          client.files["confirm-upload"][":fileId"].$post({
            param: { fileId },
          }),
        sharedT.apiCodes,
      );

      setUploads((prev) => ({
        ...prev,
        [id]: { ...prev[id]!, state: "success" },
      }));
      queryClient.invalidateQueries({ queryKey: ["folder-files"] });
      queryClient.invalidateQueries({ queryKey: ["files"] });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : sharedT.apiCodes.FALLBACK_ERROR;
      setUploads((prev) => ({
        ...prev,
        [id]: { ...prev[id]!, state: "failure", error: message },
      }));
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => handleFileUpload(file));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 30 * 1024 * 1024,
    maxFiles: 10,
    disabled: !folderId,
  });

  const clearUploads = () => setUploads({});

  return {
    getRootProps,
    getInputProps,
    isDragActive,
    uploads,
    clearUploads,
  };
}
