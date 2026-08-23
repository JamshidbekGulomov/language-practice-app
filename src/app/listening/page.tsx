import { ModuleLanding } from "@/components/module-landing";
import { MODULES } from "@/lib/modules";

export default function ListeningPage() {
  return <ModuleLanding mod={MODULES.find((m) => m.slug === "listening")!} />;
}
