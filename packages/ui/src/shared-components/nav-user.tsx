"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronsUpDown, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../components/sidebar-left";
import { useSharedTranslations } from "../contexts/shared-translations-context";
import { useUser } from "../contexts/user-context";
import { useIsMobile } from "../hooks/use-mobile";
import { client } from "../lib/auth-client";
import { apiFetcher } from "../lib/fetcher";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeSwitcher } from "./theme-switcher";
import { TwoFactorMenuItem } from "./two-factor-menu-item";

export const NavUser = memo(() => {
  const { locale, sharedT } = useSharedTranslations();

  const user = useUser();
  const isMobile = useIsMobile();
  const router = useRouter();

  const enableEmailSignup =
    process.env.NEXT_PUBLIC_ENABLE_EMAIL_SIGNUP === "true";

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () =>
      apiFetcher((client) => client.profiles.$get(), sharedT.apiCodes),
  });

  const username = profile?.username;

  const initials = username
    ?.split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground">
                {initials}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {username ?? sharedT.navUser.noUsername}
                </span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={9}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground">
                  {initials}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {username ?? sharedT.navUser.unnamed}
                  </span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                disabled={isLoading}
                onClick={() => {
                  router.push(`/${locale}/profile`);
                }}
              >
                <User />
                {isLoading
                  ? sharedT.navUser.loading
                  : sharedT.navUser.updateProfile}
              </DropdownMenuItem>
              {enableEmailSignup && <TwoFactorMenuItem />}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <LocaleSwitcher />
              <ThemeSwitcher />
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await client.signOut();
              }}
            >
              <LogOut />
              {sharedT.navUser.logOut}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
});
