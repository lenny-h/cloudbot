"use client";

import { useState } from "react";
import { toast } from "sonner";
import { deleteUser } from "@/utils/auth";
import { UserWithDetails } from "@/utils/users";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

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
