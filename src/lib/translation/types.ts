export type TranslationLevel = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  created_at: string;
};

export type TranslationSentence = {
  id: string;
  level_id: string;
  uzbek_text: string;
  model_answer: string | null;
  created_at: string;
};

export type TranslationSubmission = {
  id: string;
  user_id: string;
  sentence_id: string;
  level_id: string;
  submission: string;
  self_checked: boolean;
  sent_to_teacher: boolean;
  teacher_feedback: string | null;
  reviewed_at: string | null;
  created_at: string;
};
