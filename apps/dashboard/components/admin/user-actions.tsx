"use client";

import { useDashboardTranslations } from "@/contexts/dashboard-translations";
import { type UserWithDetails } from "@workspace/api-routes/types/user-with-details";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Ban, LogOut, MoreHorizontal, Shield, Trash2 } from "lucide-react";
import { useState } from "react";
import { UserBanDialog } from "./user-ban-dialog";
import { UserDeleteDialog } from "./user-delete-dialog";
import { UserRevokeSessionsDialog } from "./user-revoke-sessions-dialog";
import { UserRoleDialog } from "./user-role-dialog";
import { UserUnbanDialog } from "./user-unban-dialog";

interface UserActionsProps {
  user: UserWithDetails;
  onActionComplete: () => void;
}

export function UserActions({ user, onActionComplete }: UserActionsProps) {
  const { dashboardT } = useDashboardTranslations();
  const t = dashboardT.userActions;
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showUnbanDialog, setShowUnbanDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRevokeSessionsDialog, setShowRevokeSessionsDialog] =
    useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleDialogClose = (
    setter: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    setter(false);
  };

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">{t.openMenu}</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="text-sm">
          <DropdownMenuLabel className="text-muted-foreground text-xs font-medium">
            {t.actions}
          </DropdownMenuLabel>
          <DropdownMenuItem
            className="text-xs"
            onClick={() => {
              setDropdownOpen(false);
              setShowRoleDialog(true);
            }}
          >
            <Shield className="mr-2 h-4 w-4" />
            <span>{t.updateRole}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {user.banned ? (
            <DropdownMenuItem
              className="text-xs"
              onClick={() => {
                setDropdownOpen(false);
                setShowUnbanDialog(true);
              }}
            >
              <Ban className="mr-2 h-4 w-4" />
              <span>{t.unbanUser}</span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className="text-xs"
              onClick={() => {
                setDropdownOpen(false);
                setShowBanDialog(true);
              }}
            >
              <Ban className="mr-2 h-4 w-4" />
              <span>{t.banUser}</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-xs"
            onClick={() => {
              setDropdownOpen(false);
              setShowDeleteDialog(true);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>{t.deleteUser}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-xs"
            onClick={() => {
              setDropdownOpen(false);
              setShowRevokeSessionsDialog(true);
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>{t.revokeAllSessions}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs */}
      <UserBanDialog
        user={user}
        isOpen={showBanDialog}
        onClose={() => {
          handleDialogClose(setShowBanDialog);
          onActionComplete();
        }}
      />

      <UserUnbanDialog
        user={user}
        isOpen={showUnbanDialog}
        onClose={() => {
          handleDialogClose(setShowUnbanDialog);
          onActionComplete();
        }}
      />

      <UserDeleteDialog
        user={user}
        isOpen={showDeleteDialog}
        onClose={() => {
          handleDialogClose(setShowDeleteDialog);
          onActionComplete();
        }}
      />

      <UserRevokeSessionsDialog
        user={user}
        isOpen={showRevokeSessionsDialog}
        onClose={() => {
          handleDialogClose(setShowRevokeSessionsDialog);
          onActionComplete();
        }}
      />

      <UserRoleDialog
        user={user}
        isOpen={showRoleDialog}
        onClose={() => {
          handleDialogClose(setShowRoleDialog);
          onActionComplete();
        }}
      />
    </>
  );
}
