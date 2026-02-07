export const allowedMediaTypes = [
  "image/jpg",
  "image/jpeg",
  "image/png",
  "application/pdf",
] as const;

export const allowedExtensions = new Set(
  allowedMediaTypes.map((type) => {
    return type.split("/").pop();
  }),
);
