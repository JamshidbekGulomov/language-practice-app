import type { SpeakingExam, SpeakingFormat } from "@/lib/speaking/exams";

export type SpeakingTopic = {
  id: string;
  title: string;
  slug: string;
  prompt: string;
  exam: SpeakingExam;
  part: string;
  format: SpeakingFormat;
  created_at: string;
};

export type SpeakingQuestion = {
  id: string;
  topic_id: string;
  question: string;
  created_at: string;
};

export type SpeakingHint = {
  id: string;
  topic_id: string;
  word: string;
  meaning: string | null;
  created_at: string;
};

export type SpeakingImage = {
  id: string;
  topic_id: string;
  image_path: string;
  position: number;
  created_at: string;
};

export type SpeakingSubmission = {
  id: string;
  user_id: string;
  topic_id: string;
  audio_path: string;
  self_checked: boolean;
  sent_to_teacher: boolean;
  teacher_feedback: string | null;
  reviewed_at: string | null;
  created_at: string;
};
