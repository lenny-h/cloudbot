"use client";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useDashboardTranslations } from "@/contexts/dashboard-translations";
import { deleteUser } from "@/utils/auth";
import { type UserWithDetails } from "@workspace/api-routes/types/user-with-details.js";
import { useState } from "react";
import { toast } from "sonner";

interface UserDeleteDialogProps {
  user: UserWithDetails;
  isOpen: boolean;
  onClose: () => void;
}

export function UserDeleteDialog({
  user,
  isOpen,
  onClose,
}: UserDeleteDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { dashboardT } = useDashboardTranslations();
  const t = dashboardT.userDeleteDialog;

  const handleDeleteUser = async () => {
    try {
      setIsLoading(true);
      await deleteUser(user.id);
      toast.success(t.deleted.replace("{name}", user.name || user.email));
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
      onConfirm={handleDeleteUser}
      title={t.title.replace("{name}", user.name || user.email)}
      description={t.description}
      confirmText={isLoading ? t.processing : t.confirm}
      confirmVariant="destructive"
    />
  );
}
