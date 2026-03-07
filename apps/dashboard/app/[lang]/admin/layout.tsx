"use client";

import DashboardLayout from "@/components/admin/dashboard-layout";
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
  const router = useRouter();

  useEffect(() => {
    if (!isPending) {
      if (data?.user && data.user.role !== "admin") {
        return notFound();
      }
      router.push("/");
    }
  }, [isPending, data, router]);

  if (isPending || !data?.user || data.user.role !== "admin") {
    return <CentralLoadingScreen />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
