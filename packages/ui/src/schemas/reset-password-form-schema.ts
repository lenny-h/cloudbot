import * as z from "zod";

export const resetPasswordFormSchema = z
  .object({
    password: z
      .string()
      .min(8, {
        message: "Password must be at least 8 characters long",
      })
      .max(64, {
        message: "Password must be at most 64 characters long",
      }),
    confirmPassword: z
      .string()
      .min(8, {
        message: "Confirm password must be at least 8 characters long",
      })
      .max(64, {
        message: "Confirm password must be at most 64 characters long",
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>;
