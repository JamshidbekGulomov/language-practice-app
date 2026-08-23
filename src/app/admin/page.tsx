import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { MODULES } from "@/lib/modules";

export default async function AdminDashboardPage() {
  const profile = await requireAdmin();

  return (
    <div>
      <AdminPageHeader
        title="Admin dashboard"
        description={`Signed in as ${profile.email}.`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.slug}
              href={`/admin/${m.slug}`}
              className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div
                className={`inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${m.gradient} text-white`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-3 font-bold text-slate-900">{m.name}</h2>
              <p className="mt-1 text-sm text-slate-500">Manage content</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
