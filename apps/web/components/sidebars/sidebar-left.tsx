"use client"; // Change to server after changing team switcher

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarRail,
} from "@workspace/ui/components/sidebar-left";
import { NavUser } from "@workspace/ui/shared-components/nav-user";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { useSidebar } from "@workspace/ui/components/sidebar-left";
import { Cloud } from "lucide-react";
import Link from "next/link";
import { NavHistory } from "./nav-history";
import { NavMain } from "./nav-main";

export const SidebarLeft = () => {
  const { locale } = useSharedTranslations();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar variant="floating" className="border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row items-center gap-2 px-2 py-1.5">
            <Link
              className="flex flex-row items-center gap-2"
              href={`/${locale}`}
              onClick={() => {
                setOpenMobile(false);
              }}
            >
              <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Cloud className="size-4" />
              </div>
              <span className="cursor-pointer font-semibold text-lg hover:text-primary transition-colors">
                CloudBot
              </span>
            </Link>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        <NavHistory />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};
