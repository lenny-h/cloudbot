"use client";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useDashboardTranslations } from "@/contexts/dashboard-translations";
import { unbanUser } from "@/utils/auth";
import { type UserWithDetails } from "@workspace/api-routes/types/user-with-details.js";
import { useState } from "react";
import { toast } from "sonner";

interface UserUnbanDialogProps {
  user: UserWithDetails;
  isOpen: boolean;
  onClose: () => void;
}

export function UserUnbanDialog({
  user,
  isOpen,
  onClose,
}: UserUnbanDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { dashboardT } = useDashboardTranslations();
  const t = dashboardT.userUnbanDialog;

  const handleUnbanUser = async () => {
    try {
      setIsLoading(true);
      await unbanUser(user.id);
      toast.success(t.unbanned.replace("{name}", user.name || user.email));
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
      onConfirm={handleUnbanUser}
      title={t.title.replace("{name}", user.name || user.email)}
      description={t.description}
      confirmText={isLoading ? t.processing : t.confirm}
    />
  );
}
