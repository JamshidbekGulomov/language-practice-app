import { ModuleLanding } from "@/components/module-landing";
import { MODULES } from "@/lib/modules";

export default function SpeakingPage() {
  return <ModuleLanding mod={MODULES.find((m) => m.slug === "speaking")!} />;
}
