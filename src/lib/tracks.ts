import { GraduationCap, Award, BadgeCheck, type LucideIcon } from "lucide-react";

/**
 * The three top-level entry points on the homepage. "General English"
 * groups the five modules that aren't exam-specific; IELTS and CEFR each
 * link straight into that exam's Speaking practice (src/lib/speaking/exams.ts)
 * since that's the only exam-specific content today — a natural place to
 * add more IELTS/CEFR-specific modules later without touching Speaking.
 */
export type Track = {
  slug: "general" | "ielts" | "cefr";
  name: string;
  tagline: string;
  href: string;
  icon: LucideIcon;
  gradient: string;
};

export const TRACKS: Track[] = [
  {
    slug: "general",
    name: "General English",
    tagline: "Listening, reading, vocabulary, writing, and translation",
    href: "/general",
    icon: GraduationCap,
    gradient: "from-indigo-400 to-violet-600",
  },
  {
    slug: "ielts",
    name: "IELTS",
    tagline: "Speaking practice for the IELTS exam",
    href: "/speaking/ielts",
    icon: Award,
    gradient: "from-rose-400 to-red-600",
  },
  {
    slug: "cefr",
    name: "CEFR",
    tagline: "Speaking practice for the CEFR exam",
    href: "/speaking/cefr",
    icon: BadgeCheck,
    gradient: "from-emerald-400 to-teal-600",
  },
];
