export type SpeakingExam = "cefr" | "ielts";
export type SpeakingFormat = "qa" | "cue_card" | "images";

export type SpeakingPartDef = {
  key: string;
  label: string;
  description: string;
  format: SpeakingFormat;
  imageCount?: number;
};

/**
 * The full exam/part taxonomy. This is the single source of truth for
 * what parts exist per exam and what format each renders as — admin
 * create/edit forms and the DB check constraint on speaking_topics both
 * derive from this shape, so keep them in sync if it changes.
 */
export const SPEAKING_EXAMS: Record<SpeakingExam, { label: string; parts: SpeakingPartDef[] }> = {
  cefr: {
    label: "CEFR",
    parts: [
      { key: "part1", label: "Part 1", description: "Question & answer", format: "qa" },
      {
        key: "part1_1",
        label: "Part 1.1",
        description: "Two images — questions",
        format: "images",
        imageCount: 2,
      },
      { key: "part2", label: "Part 2", description: "Cue card", format: "cue_card" },
      {
        key: "part3",
        label: "Part 3",
        description: "Image — describe",
        format: "images",
        imageCount: 1,
      },
    ],
  },
  ielts: {
    label: "IELTS",
    parts: [
      { key: "part1", label: "Part 1", description: "Question & answer", format: "qa" },
      { key: "part2", label: "Part 2", description: "Cue card", format: "cue_card" },
      { key: "part3", label: "Part 3", description: "Question & answer", format: "qa" },
    ],
  },
};

export function isSpeakingExam(value: string): value is SpeakingExam {
  return value === "cefr" || value === "ielts";
}

export function getPartDef(exam: SpeakingExam, part: string): SpeakingPartDef | undefined {
  return SPEAKING_EXAMS[exam]?.parts.find((p) => p.key === part);
}
