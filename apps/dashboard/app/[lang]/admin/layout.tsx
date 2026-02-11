import DashboardLayout from "@/components/admin/dashboard-layout";
import { auth } from "@workspace/server/auth-server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    return notFound();
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
