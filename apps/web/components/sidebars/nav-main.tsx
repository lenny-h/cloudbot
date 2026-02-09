"use client";

import { useChatControl } from "@/contexts/chat-control-context";
import { useWebTranslations } from "@/contexts/web-translations";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar-left";
import { Switch } from "@workspace/ui/components/switch";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import {
  FileText,
  MessageCircleDashed,
  MessageCirclePlus,
  Search,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { memo } from "react";

export const NavMain = memo(() => {
  const { locale } = useSharedTranslations();
  const { webT } = useWebTranslations();
  const pathname = usePathname();
  const router = useRouter();

  const { isTemporary, setIsTemporary } = useChatControl();
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          className="cursor-pointer"
          onClick={() => {
            setOpenMobile(false);
            router.push(`/${locale}`);
            router.refresh();
          }}
        >
          <MessageCirclePlus className="text-primary" />
          <span>{webT.navMain.newChat}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {(pathname === `/${locale}` || pathname.endsWith("/practice")) && (
        <SidebarMenuItem className="flex items-center space-x-2">
          <SidebarMenuButton
            className="w-fit cursor-pointer"
            onClick={() => setIsTemporary(!isTemporary)}
          >
            <MessageCircleDashed />
            <span>{webT.navMain.temporaryChat}</span>
          </SidebarMenuButton>
          <Switch
            id="temp"
            checked={isTemporary}
            onCheckedChange={setIsTemporary}
            className="cursor-pointer"
          />
        </SidebarMenuItem>
      )}

      <SidebarMenuItem className="mt-4">
        <SidebarMenuButton
          asChild
          isActive={pathname === `/${locale}` || pathname.includes("chat")}
        >
          <Link href={`/${locale}`}>
            <Sparkles />
            <span>{webT.navMain.chatLabel}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname === `/${locale}/search`}>
          <Link href={`/${locale}/search`}>
            <Search />
            <span>{webT.navMain.searchLabel}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={pathname === `/${locale}/documents`}
        >
          <Link href={`/${locale}/documents`}>
            <FileText />
            <span>{webT.navMain.documentsLabel}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
});
