import type { Exam } from "@/lib/exam";

export type ListeningExamTest = {
  id: string;
  exam: Exam;
  title: string;
  slug: string;
  created_at: string;
};

export type ListeningExamSection = {
  id: string;
  test_id: string;
  section_number: 1 | 2 | 3 | 4;
  label: string;
  audio_path: string;
  transcript: string | null;
  created_at: string;
};

export type ListeningExamNote = {
  id: string;
  user_id: string;
  test_id: string;
  content: string;
  updated_at: string;
};
