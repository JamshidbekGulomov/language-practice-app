export type WritingLesson = {
  id: string;
  title: string;
  slug: string;
  youtube_url: string;
  description: string | null;
  created_at: string;
};

export type GapFillExercise = {
  id: string;
  lesson_id: string;
  prompt: string;
  answer: string;
  created_at: string;
};

export type SentencePrompt = {
  id: string;
  lesson_id: string;
  words: string;
  model_answer: string | null;
  created_at: string;
};

export type GapFillResult = {
  id: string;
  user_id: string;
  lesson_id: string;
  score: number;
  total: number;
  created_at: string;
};

export type SentenceSubmission = {
  id: string;
  user_id: string;
  prompt_id: string;
  lesson_id: string;
  submission: string;
  self_checked: boolean;
  sent_to_teacher: boolean;
  teacher_feedback: string | null;
  reviewed_at: string | null;
  created_at: string;
};
