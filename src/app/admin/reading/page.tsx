import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";
import { MODULES } from "@/lib/modules";

export default function AdminReadingPage() {
  return <AdminModulePlaceholder mod={MODULES.find((m) => m.slug === "reading")!} phase={4} />;
}
