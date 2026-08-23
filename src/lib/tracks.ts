import { GraduationCap, Award, BadgeCheck, type LucideIcon } from "lucide-react";

/**
 * The three top-level entry points on the homepage. "General English"
 * groups the five modules that aren't exam-specific. IELTS and CEFR each
 * link to an exam hub (src/app/[exam]/page.tsx) with three windows —
 * Listening, Reading, Speaking — all scoped to that exam: Listening/Reading
 * via the nullable `exam` column on listening_clips/reading_passages, and
 * Speaking via its existing exam/part taxonomy (src/lib/speaking/exams.ts).
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
    tagline: "Listening, reading, and speaking for the IELTS exam",
    href: "/ielts",
    icon: Award,
    gradient: "from-rose-400 to-red-600",
  },
  {
    slug: "cefr",
    name: "CEFR",
    tagline: "Listening, reading, and speaking for the CEFR exam",
    href: "/cefr",
    icon: BadgeCheck,
    gradient: "from-emerald-400 to-teal-600",
  },
];
