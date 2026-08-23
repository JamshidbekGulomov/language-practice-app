import { ModuleLanding } from "@/components/module-landing";
import { MODULES } from "@/lib/modules";

export default function VocabularyPage() {
  return <ModuleLanding mod={MODULES.find((m) => m.slug === "vocabulary")!} />;
}
