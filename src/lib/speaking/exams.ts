export type SpeakingExam = "cefr" | "ielts";
export type SpeakingFormat = "qa" | "cue_card" | "images";

export type SpeakingPartDef = {
  key: string;
  label: string;
  description: string;
  format: SpeakingFormat;
  /**
   * "turns" = each question gets its own separate recording, self-check,
   * and send-to-teacher (qa parts, and CEFR 1.1's 3 questions about its
   * two images — the images stay visible throughout). "single" = one
   * take for the whole part (cue card, or a plain "describe this image"
   * part with no questions attached).
   */
  interaction: "turns" | "single";
  /** Exact image count for "images" parts. */
  imageCount?: number;
  /**
   * Question-count rule: undefined = open-ended list (qa parts); 0 =
   * questions aren't used at all for this part; a positive number =
   * exactly that many required (e.g. the 3 questions tied to CEFR 1.1's
   * two images).
   */
  questionCount?: number;
  /** Cue-card-only: seconds of silent prep before recording starts automatically. */
  prepSeconds?: number;
  /** Cue-card-only: recording auto-stops after this many seconds. */
  maxSeconds?: number;
};

/**
 * The full exam/part taxonomy. This is the single source of truth for
 * what parts exist per exam, what format each renders as, and how the
 * practice mechanic works (turn-by-turn Q&A vs. a single timed cue-card
 * take vs. a single untimed take against images) — admin create/edit
 * forms, the public practice UI, and the DB check constraint on
 * speaking_topics all derive from this shape, so keep them in sync if
 * it changes.
 */
export const SPEAKING_EXAMS: Record<SpeakingExam, { label: string; parts: SpeakingPartDef[] }> = {
  cefr: {
    label: "CEFR",
    parts: [
      { key: "part1", label: "Part 1", description: "Question & answer", format: "qa", interaction: "turns" },
      {
        key: "part1_1",
        label: "Part 1.1",
        description: "Two images — questions",
        format: "images",
        interaction: "turns",
        imageCount: 2,
        questionCount: 3,
      },
      {
        key: "part2",
        label: "Part 2",
        description: "Cue card",
        format: "cue_card",
        interaction: "single",
        prepSeconds: 60,
        maxSeconds: 120,
      },
      {
        key: "part3",
        label: "Part 3",
        description: "Image — describe",
        format: "images",
        interaction: "single",
        imageCount: 1,
        questionCount: 0,
      },
    ],
  },
  ielts: {
    label: "IELTS",
    parts: [
      { key: "part1", label: "Part 1", description: "Question & answer", format: "qa", interaction: "turns" },
      {
        key: "part2",
        label: "Part 2",
        description: "Cue card",
        format: "cue_card",
        interaction: "single",
        prepSeconds: 60,
        maxSeconds: 120,
      },
      { key: "part3", label: "Part 3", description: "Question & answer", format: "qa", interaction: "turns" },
    ],
  },
};

export function isSpeakingExam(value: string): value is SpeakingExam {
  return value === "cefr" || value === "ielts";
}

export function getPartDef(exam: SpeakingExam, part: string): SpeakingPartDef | undefined {
  return SPEAKING_EXAMS[exam]?.parts.find((p) => p.key === part);
}
