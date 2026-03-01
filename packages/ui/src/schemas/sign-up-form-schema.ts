import * as z from "zod";

export const signUpFormSchema = z
  .object({
    email: z
      .email({
        message: "Please enter a valid email address",
      })
      .min(3, {
        message: "Email is required",
      })
      .max(64, {
        message: "Email must be at most 64 characters long",
      }),
    password: z
      .string()
      .min(8, {
        message: "Password must be at least 8 characters long",
      })
      .max(64, {
        message: "Password must be at most 64 characters long",
      }),
    name: z
      .string()
      .min(3, {
        message: "Name is required and must be at least 3 characters long.",
      })
      .max(128, {
        message: "Name must be less than 32 characters.",
      }),
    username: z
      .string()
      .min(3, {
        message: "Username is required and must be at least 3 characters long.",
      })
      .max(32, {
        message: "Username must be less than 32 characters.",
      })
      .regex(/^[a-zA-Z0-9_]+$/, {
        message: "Username can only contain letters, numbers, and underscores.",
      }),
    confirmPassword: z.string().min(1, {
      message: "Please confirm your password",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignUpFormData = z.infer<typeof signUpFormSchema>;
