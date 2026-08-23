import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";
import { MODULES } from "@/lib/modules";

export default function AdminTranslationPage() {
  return <AdminModulePlaceholder mod={MODULES.find((m) => m.slug === "translation")!} phase={7} />;
}
