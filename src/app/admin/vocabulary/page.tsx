import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";
import { MODULES } from "@/lib/modules";

export default function AdminVocabularyPage() {
  return <AdminModulePlaceholder mod={MODULES.find((m) => m.slug === "vocabulary")!} phase={2} />;
}
