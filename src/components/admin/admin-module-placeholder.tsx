import { AdminPageHeader } from "@/components/admin/admin-page-header";
import type { ModuleDef } from "@/lib/modules";

export function AdminModulePlaceholder({ mod, phase }: { mod: ModuleDef; phase: number }) {
  return (
    <div>
      <AdminPageHeader title={`${mod.name} content`} description={mod.tagline} />
      <div className="rounded-lg border border-dashed border-slate-300 px-6 py-16 text-center">
        <p className="text-sm font-medium text-slate-500">
          Content management for {mod.name} lands in Phase {phase}.
        </p>
      </div>
    </div>
  );
}
