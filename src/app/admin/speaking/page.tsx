import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";
import { MODULES } from "@/lib/modules";

export default function AdminSpeakingPage() {
  return <AdminModulePlaceholder mod={MODULES.find((m) => m.slug === "speaking")!} phase={6} />;
}
