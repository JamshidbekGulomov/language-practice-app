import type { ModuleDef } from "@/lib/modules";

export function ModuleLanding({ mod }: { mod: ModuleDef }) {
  const Icon = mod.icon;
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
      <div
        className={`mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${mod.gradient} text-white shadow-sm`}
      >
        <Icon className="h-8 w-8" />
      </div>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">
        {mod.name}
      </h1>
      <p className="mt-3 text-lg text-slate-500">{mod.tagline}</p>
      <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-500">
        Coming soon
      </div>
    </div>
  );
}
