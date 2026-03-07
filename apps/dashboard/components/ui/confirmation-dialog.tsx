"use client";

import { useDashboardTranslations } from "@/contexts/dashboard-translations";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { type ReactNode } from "react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "default" | "destructive";
  children?: ReactNode;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  confirmVariant = "default",
  children,
}: ConfirmationDialogProps) {
  const { dashboardT } = useDashboardTranslations();
  const t = dashboardT.confirmationDialog;
  const resolvedConfirmText = confirmText ?? t.confirm;
  const resolvedCancelText = cancelText ?? t.cancel;
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  // Fixed to handle state changes properly
  const handleOpenChange = (open: boolean) => {
    if (!open && isOpen) {
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>
            {resolvedCancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={
              confirmVariant === "destructive"
                ? "bg-destructive hover:bg-destructive/90 text-white"
                : ""
            }
          >
            {resolvedConfirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
