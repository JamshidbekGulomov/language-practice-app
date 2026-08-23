import {
  Headphones,
  BookOpen,
  Layers,
  PenLine,
  Mic,
  Languages,
  type LucideIcon,
} from "lucide-react";

export type ModuleDef = {
  slug: string;
  name: string;
  tagline: string;
  icon: LucideIcon;
  gradient: string;
};

export const MODULES: ModuleDef[] = [
  {
    slug: "listening",
    name: "Listening",
    tagline: "Audio clips, transcripts, and vocab games",
    icon: Headphones,
    gradient: "from-sky-400 to-blue-600",
  },
  {
    slug: "reading",
    name: "Reading",
    tagline: "Passages paired with vocab practice",
    icon: BookOpen,
    gradient: "from-emerald-400 to-teal-600",
  },
  {
    slug: "vocabulary",
    name: "Vocabulary",
    tagline: "Flashcards, matching, and synonym mode",
    icon: Layers,
    gradient: "from-violet-400 to-purple-600",
  },
  {
    slug: "writing",
    name: "Writing",
    tagline: "Structure videos, gap-fill, and free writing",
    icon: PenLine,
    gradient: "from-amber-400 to-orange-600",
  },
  {
    slug: "speaking",
    name: "Speaking",
    tagline: "Topics, guided questions, and vocab hints",
    icon: Mic,
    gradient: "from-rose-400 to-pink-600",
  },
  {
    slug: "translation",
    name: "Translation",
    tagline: "Structures by level, with teacher feedback",
    icon: Languages,
    gradient: "from-cyan-400 to-indigo-600",
  },
];
