"use client";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
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

// Ban duration options in days
const BAN_DURATIONS = [
  { label: "1 day", value: "1" },
  { label: "3 days", value: "3" },
  { label: "7 days", value: "7" },
  { label: "14 days", value: "14" },
  { label: "30 days", value: "30" },
  { label: "90 days", value: "90" },
  { label: "Permanent", value: "permanent" },
];

export function UserBanDialog({ user, isOpen, onClose }: UserBanDialogProps) {
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
      toast.success(`${user.name || user.email} has been banned.`);
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
      title={`Ban User: ${user.name || user.email}`}
      description="This will prevent the user from accessing the platform."
      confirmText={isLoading ? "Processing..." : "Ban User"}
      confirmVariant="destructive"
    >
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="reason">Reason for ban (optional)</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for banning this user (default: Spamming)"
            className="resize-none"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="banDuration">Ban duration</Label>
          <Select value={banDuration} onValueChange={setBanDuration}>
            <SelectTrigger id="banDuration" className="w-full">
              <SelectValue placeholder="Select duration" />
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
