import type { QuestionGroup, ReadingExamPassage } from "@/lib/reading-exam/types";
import { questionsInGroup, correctAnswer } from "@/lib/reading-exam/types";

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isCorrectAnswer(group: QuestionGroup, question: number, given: string): boolean {
  const correct = correctAnswer(group, question);
  if (correct === undefined) return false;
  if (group.type === "summary_completion") return normalize(given) === normalize(correct);
  return given === correct;
}

export type GradeResult = {
  score: number;
  total: number;
  perQuestion: { question: number; correct: boolean; given: string; correctAnswer: string }[];
  groupScores: Record<string, { label: string; score: number; total: number }>;
};

export function gradePassage(
  passage: Pick<ReadingExamPassage, "question_groups">,
  answers: Record<string, string>,
): GradeResult {
  let score = 0;
  const perQuestion: GradeResult["perQuestion"] = [];
  const groupScores: GradeResult["groupScores"] = {};

  for (const group of passage.question_groups) {
    const qs = questionsInGroup(group);
    let groupScore = 0;
    for (const q of qs) {
      const given = answers[String(q)] ?? "";
      const correct = correctAnswer(group, q) ?? "";
      const ok = isCorrectAnswer(group, q, given);
      if (ok) {
        score++;
        groupScore++;
      }
      perQuestion.push({ question: q, correct: ok, given, correctAnswer: correct });
    }
    groupScores[group.type + ":" + group.label] = { label: group.label, score: groupScore, total: qs.length };
  }

  perQuestion.sort((a, b) => a.question - b.question);
  return { score, total: perQuestion.length, perQuestion, groupScores };
}
