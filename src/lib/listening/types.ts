import type { Exam } from "@/lib/exam";

export type ListeningClip = {
  id: string;
  title: string;
  slug: string;
  audio_path: string;
  transcript: string | null;
  exam: Exam | null;
  created_at: string;
};

export type ListeningWord = {
  id: string;
  clip_id: string;
  word: string;
  meaning: string | null;
  created_at: string;
};

export type ListeningGameMode = "multiple_choice" | "fill_blank" | "matching";
