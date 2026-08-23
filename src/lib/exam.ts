export type Exam = "cefr" | "ielts";

export function isExam(value: string): value is Exam {
  return value === "cefr" || value === "ielts";
}

export const EXAM_LABELS: Record<Exam, string> = {
  cefr: "CEFR",
  ielts: "IELTS",
};
