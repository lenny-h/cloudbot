"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "../components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/dialog";
import { DropdownMenuItem } from "../components/dropdown-menu";
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
import { useUser } from "../contexts/user-context";
import { client } from "../lib/auth-client";

// ─── Schemas ────────────────────────────────────────────────────────────────

const passwordSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

const confirmSchema = z.object({
  code: z
    .string()
    .length(6, "Code must be exactly 6 digits")
    .regex(/^\d+$/, "Digits only"),
});

type PasswordFormData = z.infer<typeof passwordSchema>;
type ConfirmFormData = z.infer<typeof confirmSchema>;

// ─── Types ───────────────────────────────────────────────────────────────────

type EnableStep = "password" | "qr" | "backup";

// ─── Component ───────────────────────────────────────────────────────────────

export function TwoFactorMenuItem() {
  const { sharedT } = useSharedTranslations();
  const t = sharedT.navUser.twoFactor;
  const user = useUser();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<EnableStep>("password");
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const isEnabled = user.twoFactorEnabled ?? false;

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "" },
  });

  const confirmForm = useForm<ConfirmFormData>({
    resolver: zodResolver(confirmSchema),
    defaultValues: { code: "" },
  });

  function handleOpen() {
    setOpen(true);
    setStep("password");
    setTotpUri(null);
    setBackupCodes([]);
    passwordForm.reset();
    confirmForm.reset();
  }

  function handleClose() {
    setOpen(false);
  }

  // ── Enable: step 1 — submit password, get URI ─────────────────────────────
  async function onPasswordSubmit(values: PasswordFormData) {
    if (isEnabled) {
      // Disable flow
      const promise = client.twoFactor.disable(
        { password: values.password },
        {
          onSuccess() {
            handleClose();
            window.location.reload();
          },
          onError(ctx) {
            throw new Error(ctx.error.message);
          },
        },
      );
      toast.promise(promise, {
        loading: t.disabling,
        success: t.disableSuccess,
        error: (err) => err.message || t.disableError,
      });
    } else {
      // Enable flow — get TOTP URI
      const res = await client.twoFactor.enable({ password: values.password });
      if (res.error) {
        passwordForm.setError("password", { message: res.error.message });
        return;
      }
      if (res.data?.totpURI) {
        setTotpUri(res.data.totpURI);
        setBackupCodes(res.data.backupCodes ?? []);
        setStep("qr");
      }
    }
  }

  // ── Enable: step 2 — confirm code ────────────────────────────────────────
  async function onConfirmSubmit(values: ConfirmFormData) {
    const promise = client.twoFactor.verifyTotp(
      { code: values.code },
      {
        onSuccess() {
          setStep("backup");
        },
        onError(ctx) {
          throw new Error(ctx.error.message);
        },
      },
    );
    toast.promise(promise, {
      loading: t.enabling,
      success: t.enableSuccess,
      error: (err) => err.message || t.enableError,
    });
  }

  function copyCode(code: string, idx: number) {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault();
          handleOpen();
        }}
      >
        <ShieldCheck className="size-4" />
        {isEnabled ? t.manageLabel : t.enableLabel}
      </DropdownMenuItem>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          {/* ── Password step (both enable & disable) ── */}
          {step === "password" && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {isEnabled ? t.disableTitle : t.enableTitle}
                </DialogTitle>
                <DialogDescription>
                  {isEnabled ? t.disableSubtitle : t.enableSubtitle}
                </DialogDescription>
              </DialogHeader>
              <Form {...passwordForm}>
                <form
                  onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={passwordForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.passwordLabel}</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder={t.passwordPlaceholder}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={handleClose}
                    >
                      {t.cancel}
                    </Button>
                    <Button
                      type="submit"
                      disabled={passwordForm.formState.isSubmitting}
                    >
                      {passwordForm.formState.isSubmitting
                        ? isEnabled
                          ? t.disabling
                          : t.enabling
                        : t.continue}
                    </Button>
                  </div>
                </form>
              </Form>
            </>
          )}

          {/* ── QR / confirm step ── */}
          {step === "qr" && totpUri && (
            <>
              <DialogHeader>
                <DialogTitle>{t.scanTitle}</DialogTitle>
                <DialogDescription>{t.scanSubtitle}</DialogDescription>
              </DialogHeader>
              <div className="flex justify-center rounded-lg bg-white p-4">
                <QRCode value={totpUri} size={180} />
              </div>
              <Form {...confirmForm}>
                <form
                  onSubmit={confirmForm.handleSubmit(onConfirmSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={confirmForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem className="flex flex-col items-center">
                        <FormLabel>{t.confirmCode}</FormLabel>
                        <FormControl>
                          <InputOTP
                            maxLength={6}
                            {...field}
                            onComplete={() =>
                              confirmForm.handleSubmit(onConfirmSubmit)()
                            }
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
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setStep("password")}
                    >
                      {t.back}
                    </Button>
                    <Button
                      type="submit"
                      disabled={confirmForm.formState.isSubmitting}
                    >
                      {confirmForm.formState.isSubmitting
                        ? t.enabling
                        : t.confirmButton}
                    </Button>
                  </div>
                </form>
              </Form>
            </>
          )}

          {/* ── Backup codes step ── */}
          {step === "backup" && (
            <>
              <DialogHeader>
                <DialogTitle>{t.backupTitle}</DialogTitle>
                <DialogDescription>{t.backupSubtitle}</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => copyCode(code, idx)}
                    className="font-mono text-sm bg-muted hover:bg-muted/80 rounded px-3 py-1.5 text-left transition-colors"
                  >
                    {copiedIndex === idx ? t.copied : code}
                  </button>
                ))}
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  handleClose();
                  window.location.reload();
                }}
              >
                {t.done}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
