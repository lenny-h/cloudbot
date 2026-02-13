export type UploadState = "uploading" | "success" | "failure";

export type Upload = {
  id: string;
  name: string;
  state: UploadState;
  progress?: number;
  error?: string;
};
