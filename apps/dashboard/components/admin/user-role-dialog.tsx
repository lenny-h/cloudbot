"use client";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useDashboardTranslations } from "@/contexts/dashboard-translations";
import { updateUserRole } from "@/utils/auth";
import { type UserWithDetails } from "@workspace/api-routes/types/user-with-details.js";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { useState } from "react";
import { toast } from "sonner";

interface UserRoleDialogProps {
  user: UserWithDetails;
  isOpen: boolean;
  onClose: () => void;
}

export function UserRoleDialog({ user, isOpen, onClose }: UserRoleDialogProps) {
  const { dashboardT } = useDashboardTranslations();
  const t = dashboardT.userRoleDialog;

  const ROLE_OPTIONS = [
    { label: t.user, value: "user" },
    { label: t.admin, value: "admin" },
  ];

  const [selectedRole, setSelectedRole] = useState(user.role || "user");
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateRole = async () => {
    try {
      setIsLoading(true);
      await updateUserRole(user.id, selectedRole);
      toast.success(t.updated.replace("{role}", selectedRole));
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
      onConfirm={handleUpdateRole}
      title={t.title.replace("{name}", user.name || user.email)}
      description={t.description}
      confirmText={isLoading ? t.processing : t.confirm}
    >
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="role">{t.selectRoleLabel}</Label>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger id="role" className="w-full">
              <SelectValue placeholder={t.selectRolePlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="hover:bg-muted"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </ConfirmationDialog>
  );
}
