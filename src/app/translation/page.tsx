import { ModuleLanding } from "@/components/module-landing";
import { MODULES } from "@/lib/modules";

export default function TranslationPage() {
  return <ModuleLanding mod={MODULES.find((m) => m.slug === "translation")!} />;
}
