"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "../components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/form";
import { Input } from "../components/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../components/input-otp";
import { useSharedTranslations } from "../contexts/shared-translations-context";
import { twoFactor } from "../lib/auth-client";

const totpSchema = z.object({
  code: z
    .string()
    .length(6, "Code must be exactly 6 digits")
    .regex(/^\d+$/, "Code must contain only digits"),
});

const backupSchema = z.object({
  code: z.string().min(6, "Invalid backup code").max(32),
});

type TotpFormData = z.infer<typeof totpSchema>;
type BackupFormData = z.infer<typeof backupSchema>;

export function TwoFactorVerify() {
  const { locale, sharedT } = useSharedTranslations();
  const router = useRouter();
  const [mode, setMode] = useState<"totp" | "backup">("totp");

  const totpForm = useForm<TotpFormData>({
    resolver: zodResolver(totpSchema),
    defaultValues: { code: "" },
  });

  const backupForm = useForm<BackupFormData>({
    resolver: zodResolver(backupSchema),
    defaultValues: { code: "" },
  });

  async function onTotpSubmit(values: TotpFormData) {
    const promise = twoFactor.verifyTotp(
      { code: values.code, trustDevice: true },
      {
        onSuccess() {
          router.push(`/${locale}/`);
        },
        onError(ctx) {
          throw new Error(ctx.error.message);
        },
      },
    );

    toast.promise(promise, {
      loading: sharedT.twoFactor.verifying,
      success: sharedT.twoFactor.verifySuccess,
      error: (err) => err.message || sharedT.twoFactor.verifyError,
    });
  }

  async function onBackupSubmit(values: BackupFormData) {
    const promise = twoFactor.verifyBackupCode(
      { code: values.code, trustDevice: false },
      {
        onSuccess() {
          router.push(`/${locale}/`);
        },
        onError(ctx) {
          throw new Error(ctx.error.message);
        },
      },
    );

    toast.promise(promise, {
      loading: sharedT.twoFactor.verifying,
      success: sharedT.twoFactor.verifySuccess,
      error: (err) => err.message || sharedT.twoFactor.verifyError,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold">
          {sharedT.twoFactor.pageTitle}
        </h1>
        <p className="text-muted-foreground text-sm">
          {mode === "totp"
            ? sharedT.twoFactor.totpDescription
            : sharedT.twoFactor.backupDescription}
        </p>
      </div>

      {mode === "totp" ? (
        <Form {...totpForm}>
          <form
            onSubmit={totpForm.handleSubmit(onTotpSubmit)}
            className="space-y-6"
          >
            <FormField
              control={totpForm.control}
              name="code"
              render={({ field }) => (
                <FormItem className="flex flex-col items-center">
                  <FormLabel>{sharedT.twoFactor.codeLabel}</FormLabel>
                  <FormControl>
                    <InputOTP
                      maxLength={6}
                      {...field}
                      onComplete={() => totpForm.handleSubmit(onTotpSubmit)()}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={totpForm.formState.isSubmitting}
            >
              {totpForm.formState.isSubmitting
                ? sharedT.twoFactor.verifying
                : sharedT.twoFactor.verifyButton}
            </Button>
          </form>
        </Form>
      ) : (
        <Form {...backupForm}>
          <form
            onSubmit={backupForm.handleSubmit(onBackupSubmit)}
            className="space-y-6"
          >
            <FormField
              control={backupForm.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{sharedT.twoFactor.backupCodeLabel}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={sharedT.twoFactor.backupCodePlaceholder}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={backupForm.formState.isSubmitting}
            >
              {backupForm.formState.isSubmitting
                ? sharedT.twoFactor.verifying
                : sharedT.twoFactor.verifyButton}
            </Button>
          </form>
        </Form>
      )}

      <div className="text-center">
        <Button
          variant="link"
          size="sm"
          onClick={() => setMode(mode === "totp" ? "backup" : "totp")}
        >
          {mode === "totp"
            ? sharedT.twoFactor.useBackupCode
            : sharedT.twoFactor.useAuthenticator}
        </Button>
      </div>
    </div>
  );
}
