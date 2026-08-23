import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";
import { MODULES } from "@/lib/modules";

export default function AdminListeningPage() {
  return <AdminModulePlaceholder mod={MODULES.find((m) => m.slug === "listening")!} phase={3} />;
}
