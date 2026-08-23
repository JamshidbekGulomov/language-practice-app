export type VocabCategory = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

export type VocabWord = {
  id: string;
  category_id: string;
  english: string;
  uzbek: string;
  synonym: string | null;
  example_sentence: string | null;
  difficulty: string | null;
  created_at: string;
};

export type VocabGameMode = "matching" | "synonym";

export type VocabScore = {
  id: string;
  user_id: string;
  category_id: string;
  game_mode: VocabGameMode;
  score: number;
  total: number;
  created_at: string;
};

export type LeaderboardRow = {
  score: number;
  total: number;
  created_at: string;
  display_name: string | null;
  email: string;
};
