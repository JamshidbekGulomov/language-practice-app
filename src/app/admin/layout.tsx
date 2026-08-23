import { requireAdmin } from "@/lib/supabase/require-admin";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="mx-auto flex max-w-6xl">
      <AdminSidebar />
      <div className="min-w-0 flex-1 px-6 py-8 sm:px-8">{children}</div>
    </div>
  );
}
