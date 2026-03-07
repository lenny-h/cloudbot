"use client";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useDashboardTranslations } from "@/contexts/dashboard-translations";
import { revokeUserSessions } from "@/utils/auth";
import { type UserWithDetails } from "@workspace/api-routes/types/user-with-details.js";
import { useState } from "react";
import { toast } from "sonner";

interface UserRevokeSessionsDialogProps {
  user: UserWithDetails;
  isOpen: boolean;
  onClose: () => void;
}

export function UserRevokeSessionsDialog({
  user,
  isOpen,
  onClose,
}: UserRevokeSessionsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { dashboardT } = useDashboardTranslations();
  const t = dashboardT.userRevokeSessionsDialog;

  const handleRevokeSessions = async () => {
    try {
      setIsLoading(true);
      await revokeUserSessions(user.id);
      toast.success(t.revoked.replace("{name}", user.name || user.email));
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleRevokeSessions}
      title={t.title.replace("{name}", user.name || user.email)}
      description={t.description}
      confirmText={isLoading ? t.processing : t.confirm}
      confirmVariant="destructive"
    />
  );
}
