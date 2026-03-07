"use client";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useDashboardTranslations } from "@/contexts/dashboard-translations";
import { createUser } from "@/utils/auth";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Switch } from "@workspace/ui/components/switch";
import { useState } from "react";
import { toast } from "sonner";

interface UserAddDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UserAddDialog({
  isOpen,
  onClose,
  onSuccess,
}: UserAddDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { dashboardT } = useDashboardTranslations();
  const t = dashboardT.userAddDialog;
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user" as "user" | "admin",
    autoVerify: false,
  });

  const handleCreateUser = async () => {
    try {
      setIsLoading(true);
      await createUser(formData);
      toast.success(
        formData.autoVerify ? t.createdAndVerified : t.createdWithEmail,
      );
      onSuccess?.();
      onClose();
      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "user",
        autoVerify: false,
      });
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
      onConfirm={handleCreateUser}
      title={t.title}
      description={t.description}
      confirmText={isLoading ? t.creating : t.createUser}
    >
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">{t.name}</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder={t.namePlaceholder}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">{t.email}</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            placeholder={t.emailPlaceholder}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">{t.password}</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, password: e.target.value }))
            }
            placeholder={t.passwordPlaceholder}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="role">{t.role}</Label>
          <Select
            value={formData.role}
            onValueChange={(value: "user" | "admin") =>
              setFormData((prev) => ({ ...prev, role: value }))
            }
          >
            <SelectTrigger id="role" className="w-full">
              <SelectValue placeholder={t.selectRole} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">{t.user}</SelectItem>
              <SelectItem value="admin">{t.admin}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="autoVerify" className="cursor-pointer">
            {t.autoVerify}
          </Label>
          <Switch
            id="autoVerify"
            checked={formData.autoVerify}
            onCheckedChange={(checked: boolean) =>
              setFormData((prev) => ({ ...prev, autoVerify: checked }))
            }
          />
        </div>
      </div>
    </ConfirmationDialog>
  );
}
