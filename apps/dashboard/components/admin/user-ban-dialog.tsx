"use client";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useDashboardTranslations } from "@/contexts/dashboard-translations";
import { banUser } from "@/utils/auth";
import { type UserWithDetails } from "@workspace/api-routes/types/user-with-details.js";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Textarea } from "@workspace/ui/components/textarea";
import { useState } from "react";
import { toast } from "sonner";

interface UserBanDialogProps {
  user: UserWithDetails;
  isOpen: boolean;
  onClose: () => void;
}

export function UserBanDialog({ user, isOpen, onClose }: UserBanDialogProps) {
  const { dashboardT } = useDashboardTranslations();
  const t = dashboardT.userBanDialog;

  // Ban duration options in days
  const BAN_DURATIONS = [
    { label: t["1day"], value: "1" },
    { label: t["3days"], value: "3" },
    { label: t["7days"], value: "7" },
    { label: t["14days"], value: "14" },
    { label: t["30days"], value: "30" },
    { label: t["90days"], value: "90" },
    { label: t.permanent, value: "permanent" },
  ];

  const [reason, setReason] = useState("");
  const [banDuration, setBanDuration] = useState("7"); // Default to 7 days
  const [isLoading, setIsLoading] = useState(false);

  const handleBanUser = async () => {
    try {
      setIsLoading(true);
      // Convert duration from days to seconds
      let banExpiresIn: number | undefined;
      if (banDuration === "permanent") {
        banExpiresIn = undefined;
      } else {
        banExpiresIn = parseInt(banDuration) * 24 * 60 * 60; // Days to seconds
      }

      await banUser(user.id, reason, banExpiresIn);
      toast.success(t.banned.replace("{name}", user.name || user.email));
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
      onConfirm={handleBanUser}
      title={t.title.replace("{name}", user.name || user.email)}
      description={t.description}
      confirmText={isLoading ? t.processing : t.confirm}
      confirmVariant="destructive"
    >
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="reason">{t.reasonLabel}</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t.reasonPlaceholder}
            className="resize-none"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="banDuration">{t.durationLabel}</Label>
          <Select value={banDuration} onValueChange={setBanDuration}>
            <SelectTrigger id="banDuration" className="w-full">
              <SelectValue placeholder={t.durationPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {BAN_DURATIONS.map((option) => (
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
