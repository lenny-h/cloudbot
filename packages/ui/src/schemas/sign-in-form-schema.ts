import * as z from "zod";

export const signInFormSchema = z.object({
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
});

export type SignInFormData = z.infer<typeof signInFormSchema>;
