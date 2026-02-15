import * as z from "zod";

const createFolderFormSchema = z
  .object({
    name: z
      .string()
      .min(3, {
        message: "Folder name is required.",
      })
      .max(128, {
        message: "Folder name must be less than 128 characters.",
      }),
    description: z.string().max(512, {
      message: "Folder description must be less than 512 characters.",
    }),
    visibility: z.enum(["private", "protected", "public"]),
    password: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.visibility === "protected") {
        return data.password && data.password.length >= 8;
      }
      return true;
    },
    {
      message:
        "Password is required and must be at least 8 characters long for protected folders.",
    },
  )
  .strict();

export const createFolderSchema = z
  .object({
    values: createFolderFormSchema,
  })
  .strict();
