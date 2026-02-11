"use client";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
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

  const handleDeleteUser = async () => {
    try {
      setIsLoading(true);
      await deleteUser(user.id);
      toast.success(`${user.name || user.email} has been deleted.`);
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
      title={`Delete User: ${user.name || user.email}`}
      description="This action cannot be undone. This will permanently delete the user and remove their data from the system."
      confirmText={isLoading ? "Processing..." : "Delete User"}
      confirmVariant="destructive"
    />
  );
}
