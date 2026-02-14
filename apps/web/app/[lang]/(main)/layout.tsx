"use client";

import { SidebarLeft } from "@/components/sidebars/sidebar-left";
import { ChatControlProvider } from "@/contexts/chat-control-context";
import { DataStreamProvider } from "@/contexts/data-stream-context";
import { DiffProvider } from "@/contexts/diff-context";
import { EditorProvider } from "@/contexts/editor-context";
import { FilterProvider } from "@/contexts/filter-context";
import { PDFProvider } from "@/contexts/pdf-context";
import { RefsProvider } from "@/contexts/refs-context";
import { type User } from "@workspace/server/drizzle/schema";
import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/sidebar-left";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { UserProvider } from "@workspace/ui/contexts/user-context";
import { client } from "@workspace/ui/lib/auth-client";
import { CentralLoadingScreen } from "@workspace/ui/shared-components/central-loading-screen";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data, isPending } = client.useSession();
  const { locale } = useSharedTranslations();
  const router = useRouter();

  const [defaultLeftOpen, setDefaultLeftOpen] = useState(false);

  useEffect(() => {
    if (!isPending && !data?.user) {
      router.push(`/${locale}/sign-in`);
    }
  }, [isPending, data, locale]);

  useEffect(() => {
    const match = document.cookie
      .split("; ")
      .find((c) => c.startsWith("sidebar_left="));

    if (match) {
      setDefaultLeftOpen(match.split("=")[1] === "true");
    }
  }, []);

  if (isPending || !data?.user) {
    return <CentralLoadingScreen />;
  }

  const user = data?.user;

  console.log("Authenticated user:", user);

  return (
    <UserProvider user={user as User}>
      <RefsProvider>
        <ChatControlProvider>
          <FilterProvider>
            <EditorProvider>
              <DiffProvider>
                <DataStreamProvider>
                  <PDFProvider>
                    <SidebarProvider defaultOpen={defaultLeftOpen}>
                      <SidebarLeft />
                      <SidebarInset>{children}</SidebarInset>
                    </SidebarProvider>
                  </PDFProvider>
                </DataStreamProvider>
              </DiffProvider>
            </EditorProvider>
          </FilterProvider>
        </ChatControlProvider>
      </RefsProvider>
    </UserProvider>
  );
}
