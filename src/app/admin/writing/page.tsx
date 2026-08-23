import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";
import { MODULES } from "@/lib/modules";

export default function AdminWritingPage() {
  return <AdminModulePlaceholder mod={MODULES.find((m) => m.slug === "writing")!} phase={5} />;
}
