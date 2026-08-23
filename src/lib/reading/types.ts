import type { Exam } from "@/lib/exam";

export type ReadingPassage = {
  id: string;
  title: string;
  slug: string;
  body: string;
  exam: Exam | null;
  created_at: string;
};

export type ReadingWord = {
  id: string;
  passage_id: string;
  word: string;
  meaning: string | null;
  created_at: string;
};

export type ReadingGameMode = "multiple_choice" | "fill_blank" | "matching";
