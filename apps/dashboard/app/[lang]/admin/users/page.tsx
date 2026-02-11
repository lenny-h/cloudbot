import type { Metadata } from "next";
import { UsersTable } from "@/components/admin/users-table";

export const metadata: Metadata = {
  title: "Users | Admin Dashboard",
  description: "Manage users in the admin dashboard",
};

export default function UsersPage() {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <UsersTable />
    </div>
  );
}
