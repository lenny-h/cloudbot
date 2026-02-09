"use client";

import { useRefs } from "@/contexts/refs-context";
import { useWebTranslations } from "@/contexts/web-translations";
import { resizeEditor } from "@/lib/utils";
import { Button } from "@workspace/ui/components/button";
import { SidebarTrigger } from "@workspace/ui/components/sidebar-left";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { PanelRightIcon } from "lucide-react";
import { memo } from "react";
import { FolderSelector } from "./folder-selector";

interface Props {
  showFolderSelector: boolean;
}

export const Header = memo(({ showFolderSelector }: Props) => {
  const { webT } = useWebTranslations();
  const { panelRef } = useRefs();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-3 transition-[width,height] ease-linear">
      <SidebarTrigger />
      <div className="flex items-center gap-2">
        {showFolderSelector && <FolderSelector />}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-muted-foreground/50 hidden h-8 w-8 md:flex"
              onClick={() => {
                resizeEditor(panelRef, true);
              }}
            >
              <PanelRightIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{webT.chatHeader.toggleSidebar}</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
});
