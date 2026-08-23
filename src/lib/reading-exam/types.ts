import type { Exam } from "@/lib/exam";

export type ReadingExamTest = {
  id: string;
  exam: Exam;
  title: string;
  slug: string;
  created_at: string;
};

export type Paragraph = { letter: string; text: string };
export type GlossaryTerm = { word: string; def: string; syn: string; uz: string };
export type ParaphrasePair = { keyword: string; phrase: string };

export type MatchingHeadingsGroup = {
  type: "matching_headings";
  label: string;
  startQuestion: number;
  headings: { code: string; label: string }[];
  items: { question: number; paragraphLetter: string; answerCode: string }[];
};

export type MatchingFeaturesGroup = {
  type: "matching_features";
  label: string;
  startQuestion: number;
  statements: { code: string; text: string }[];
  items: { question: number; personOrFeature: string; answerCode: string }[];
};

export type SummaryCompletionGroup = {
  type: "summary_completion";
  label: string;
  startQuestion: number;
  title: string;
  /** The summary text, with {{N}} placeholders for blanks, N = question number. */
  text: string;
  answers: { question: number; answer: string }[];
};

export type QuestionGroup = MatchingHeadingsGroup | MatchingFeaturesGroup | SummaryCompletionGroup;

export type ReadingExamPassage = {
  id: string;
  test_id: string;
  passage_number: 1 | 2 | 3;
  title: string;
  subtitle: string | null;
  paragraphs: Paragraph[];
  glossary: GlossaryTerm[];
  question_groups: QuestionGroup[];
  paraphrase_pairs: ParaphrasePair[];
  created_at: string;
};

export type ReadingExamWord = {
  id: string;
  passage_id: string;
  word: string;
  meaning: string | null;
  created_at: string;
};

export type ReadingExamAttempt = {
  id: string;
  user_id: string;
  test_id: string;
  scope: "passage" | "full";
  passage_number: number | null;
  score: number;
  total: number;
  answers: Record<string, string>;
  created_at: string;
};

export function questionsInGroup(g: QuestionGroup): number[] {
  if (g.type === "matching_headings") return g.items.map((i) => i.question);
  if (g.type === "matching_features") return g.items.map((i) => i.question);
  return g.answers.map((a) => a.question);
}

export function correctAnswer(g: QuestionGroup, question: number): string | undefined {
  if (g.type === "matching_headings") return g.items.find((i) => i.question === question)?.answerCode;
  if (g.type === "matching_features") return g.items.find((i) => i.question === question)?.answerCode;
  return g.answers.find((a) => a.question === question)?.answer;
}
