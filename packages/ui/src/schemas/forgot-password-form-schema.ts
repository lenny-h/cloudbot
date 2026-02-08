import * as z from "zod";

export const forgotPasswordFormSchema = z.object({
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
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordFormSchema>;
