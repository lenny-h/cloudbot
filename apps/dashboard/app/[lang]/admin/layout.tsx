"use client";

import DashboardLayout from "@/components/admin/dashboard-layout";
import { isAdminUser } from "@/lib/is-admin-user";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { client } from "@workspace/ui/lib/auth-client";
import { CentralLoadingScreen } from "@workspace/ui/shared-components/central-loading-screen";
import { notFound, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { data, isPending } = client.useSession();
  const { locale } = useSharedTranslations();
  const router = useRouter();

  useEffect(() => {
    if (!data?.user) {
      router.push(`/${locale}/sign-in`);
    } else if (!isAdminUser(data.user.id)) {
      return notFound();
    }
  }, [isPending, data, router]);

  if (isPending || !data?.user || !isAdminUser(data.user.id)) {
    return <CentralLoadingScreen />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
