"use client";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
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
        formData.autoVerify
          ? "User created and verified successfully"
          : "User created successfully. Verification email sent.",
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
      title="Add New User"
      description="Create a new user account with the following details."
      confirmText={isLoading ? "Creating..." : "Create User"}
    >
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Enter user's name"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            placeholder="Enter user's email"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, password: e.target.value }))
            }
            placeholder="Enter user's password"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="role">Role</Label>
          <Select
            value={formData.role}
            onValueChange={(value: "user" | "admin") =>
              setFormData((prev) => ({ ...prev, role: value }))
            }
          >
            <SelectTrigger id="role" className="w-full">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="autoVerify" className="cursor-pointer">
            Auto-verify email
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
