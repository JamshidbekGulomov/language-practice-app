import "server-only";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  return key;
}

async function generateJson(parts: object[], responseSchema: object): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey()}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseMimeType: "application/json", responseSchema },
        }),
        signal: controller.signal,
      },
    );
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Gemini took too long to respond — try again, or with a shorter/simpler PDF");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) {
    throw new Error(`Gemini request failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text;
  if (!text) {
    const reason = candidate?.finishReason || data.promptFeedback?.blockReason;
    throw new Error(`Gemini returned no content${reason ? ` (${reason})` : ""}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Gemini returned unparseable JSON: ${text.slice(0, 200)}`);
  }
}

export type SpeakingAnalysis = { transcript: string; feedback: string };

/** Transcribes a recording and gives brief written feedback — best-effort, not a substitute for teacher review. */
export async function analyzeSpeakingAudio(
  audioBase64: string,
  mimeType: string,
): Promise<SpeakingAnalysis> {
  const result = (await generateJson(
    [
      {
        text: "You are a language-learning assistant. Listen to this spoken answer and transcribe it, then give brief constructive feedback for the learner covering grammar, vocabulary, and fluency (2-4 sentences). If nothing intelligible was said, say so in both fields.",
      },
      { inline_data: { mime_type: mimeType, data: audioBase64 } },
    ],
    {
      type: "OBJECT",
      properties: {
        transcript: { type: "STRING" },
        feedback: { type: "STRING" },
      },
      required: ["transcript", "feedback"],
    },
  )) as Partial<SpeakingAnalysis>;

  return {
    transcript: typeof result.transcript === "string" ? result.transcript : "",
    feedback: typeof result.feedback === "string" ? result.feedback : "",
  };
}

export type ReadingExtraction = {
  title: string;
  subtitle: string;
  paragraphs: { letter: string; text: string }[];
  glossary: { word: string; def: string; syn: string; uz: string }[];
  matching_headings: {
    present: boolean;
    label: string;
    startQuestion: number;
    headings: { code: string; label: string }[];
    paragraphLetters: string[];
  };
  matching_features: {
    present: boolean;
    label: string;
    startQuestion: number;
    statements: { code: string; text: string }[];
    personsOrFeatures: string[];
  };
  summary_completion: {
    present: boolean;
    label: string;
    startQuestion: number;
    title: string;
    text: string;
  };
  paraphrase_pairs: { keyword: string; phrase: string }[];
};

const GROUP_PROPS = {
  present: { type: "BOOLEAN" },
  label: { type: "STRING" },
  startQuestion: { type: "INTEGER" },
};

/**
 * Step 1 of PDF-driven authoring: reads the uploaded PDF (passage +
 * questions) and pulls out its *structure* only — passage text, glossary,
 * which of the three question types are present and their raw material
 * (headings/statements lists, which paragraphs or people need an answer,
 * the summary text with blanks) — but does not yet answer anything.
 * Split out from answering so each Gemini call stays small and fast
 * (Vercel Hobby's serverless functions have a short duration cap, and one
 * call asking for extraction + reasoning through every question at once
 * routinely blew past it, killing the request with no usable response).
 */
export async function extractReadingPassage(pdfBase64: string): Promise<ReadingExtraction> {
  const result = (await generateJson(
    [
      {
        text: `You are building a computer-delivered IELTS/CEFR-style reading exam practice page from an uploaded exam PDF. Extract structure only — do not answer any questions yet.

1. The passage: a title, an optional italic subtitle/intro line, and its paragraphs split by their existing letter labels (A, B, C, ...). If paragraphs aren't lettered in the source, assign letters A, B, C... in order.
2. Pick 6-10 useful or challenging words from the passage for a glossary: a plain-English definition, one or two synonyms, and an Uzbek translation for each.
3. Identify which of these three question types appear in the questions (leave "present": false and empty arrays/strings for any type that isn't used):
   - matching_headings: choosing a heading for each paragraph from a list of heading options (more options than paragraphs). List the heading options, and "paragraphLetters": the letters of the paragraphs that need a heading, in question-number order.
   - matching_features: matching a list of people/features to statements about them, from a list of statements. List the statements, and "personsOrFeatures": the names/features in question-number order.
   - summary_completion: a short summary with numbered blanks. Return its text with each blank replaced by "{{N}}" where N is that question's number.
   For matching_headings and matching_features, give "startQuestion" as the first question number in that group.
4. Also produce 4-8 "paraphrase_pairs": a key word or short phrase taken from one of the questions, paired with the word/phrase in the passage that means the same thing. Use exact wording from the passage for "phrase".

Return only the structured data — no commentary, and no answers to any question.`,
      },
      { inline_data: { mime_type: "application/pdf", data: pdfBase64 } },
    ],
    {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        subtitle: { type: "STRING" },
        paragraphs: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: { letter: { type: "STRING" }, text: { type: "STRING" } },
            required: ["letter", "text"],
          },
        },
        glossary: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              word: { type: "STRING" },
              def: { type: "STRING" },
              syn: { type: "STRING" },
              uz: { type: "STRING" },
            },
            required: ["word", "def"],
          },
        },
        matching_headings: {
          type: "OBJECT",
          properties: {
            ...GROUP_PROPS,
            headings: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: { code: { type: "STRING" }, label: { type: "STRING" } },
                required: ["code", "label"],
              },
            },
            paragraphLetters: { type: "ARRAY", items: { type: "STRING" } },
          },
          required: ["present"],
        },
        matching_features: {
          type: "OBJECT",
          properties: {
            ...GROUP_PROPS,
            statements: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: { code: { type: "STRING" }, text: { type: "STRING" } },
                required: ["code", "text"],
              },
            },
            personsOrFeatures: { type: "ARRAY", items: { type: "STRING" } },
          },
          required: ["present"],
        },
        summary_completion: {
          type: "OBJECT",
          properties: { ...GROUP_PROPS, title: { type: "STRING" }, text: { type: "STRING" } },
          required: ["present"],
        },
        paraphrase_pairs: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: { keyword: { type: "STRING" }, phrase: { type: "STRING" } },
            required: ["keyword", "phrase"],
          },
        },
      },
      required: ["title", "paragraphs", "matching_headings", "matching_features", "summary_completion"],
    },
  )) as Partial<ReadingExtraction>;

  return {
    title: result.title ?? "",
    subtitle: result.subtitle ?? "",
    paragraphs: result.paragraphs ?? [],
    glossary: result.glossary ?? [],
    matching_headings: result.matching_headings ?? { present: false, label: "Matching Headings", startQuestion: 1, headings: [], paragraphLetters: [] },
    matching_features: result.matching_features ?? { present: false, label: "Matching Features", startQuestion: 1, statements: [], personsOrFeatures: [] },
    summary_completion: result.summary_completion ?? { present: false, label: "Summary Completion", startQuestion: 1, title: "", text: "" },
    paraphrase_pairs: result.paraphrase_pairs ?? [],
  };
}

function passageAsText(paragraphs: { letter: string; text: string }[]): string {
  return paragraphs.map((p) => `${p.letter}. ${p.text}`).join("\n\n");
}

/** Step 2a: answers a matching-headings group — text-only (fast), run after extraction so it stays well under the platform's per-request time limit. */
export async function solveMatchingHeadings(
  paragraphs: { letter: string; text: string }[],
  headings: { code: string; label: string }[],
  paragraphLetters: string[],
): Promise<{ paragraphLetter: string; answerCode: string }[]> {
  const result = (await generateJson(
    [
      {
        text: `Here is a passage split into lettered paragraphs:\n\n${passageAsText(paragraphs)}\n\nFor each of these paragraphs, in order: ${paragraphLetters.join(", ")} — choose the best-fitting heading from this list (each heading is used at most once): ${headings.map((h) => `${h.code}) ${h.label}`).join("; ")}.\n\nAnswer as a careful test-taker would, using only the passage text.`,
      },
    ],
    {
      type: "OBJECT",
      properties: {
        answers: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: { paragraphLetter: { type: "STRING" }, answerCode: { type: "STRING" } },
            required: ["paragraphLetter", "answerCode"],
          },
        },
      },
      required: ["answers"],
    },
  )) as { answers?: { paragraphLetter: string; answerCode: string }[] };

  return result.answers ?? [];
}

/** Step 2b: answers a matching-features group — text-only (fast). */
export async function solveMatchingFeatures(
  paragraphs: { letter: string; text: string }[],
  statements: { code: string; text: string }[],
  personsOrFeatures: string[],
): Promise<{ personOrFeature: string; answerCode: string }[]> {
  const result = (await generateJson(
    [
      {
        text: `Here is a passage split into lettered paragraphs:\n\n${passageAsText(paragraphs)}\n\nFor each of these people/features, in order: ${personsOrFeatures.join(", ")} — choose the statement that best matches them from this list (each statement is used at most once): ${statements.map((s) => `${s.code}) ${s.text}`).join("; ")}.\n\nAnswer as a careful test-taker would, using only the passage text.`,
      },
    ],
    {
      type: "OBJECT",
      properties: {
        answers: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: { personOrFeature: { type: "STRING" }, answerCode: { type: "STRING" } },
            required: ["personOrFeature", "answerCode"],
          },
        },
      },
      required: ["answers"],
    },
  )) as { answers?: { personOrFeature: string; answerCode: string }[] };

  return result.answers ?? [];
}

/** Step 2c: answers a summary-completion group — text-only (fast). */
export async function solveSummaryCompletion(
  paragraphs: { letter: string; text: string }[],
  summaryText: string,
): Promise<{ question: number; answer: string }[]> {
  const result = (await generateJson(
    [
      {
        text: `Here is a passage split into lettered paragraphs:\n\n${passageAsText(paragraphs)}\n\nComplete this summary using one or a few words taken from the passage for each numbered blank:\n\n${summaryText}\n\nAnswer as a careful test-taker would, using only the passage text.`,
      },
    ],
    {
      type: "OBJECT",
      properties: {
        answers: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: { question: { type: "INTEGER" }, answer: { type: "STRING" } },
            required: ["question", "answer"],
          },
        },
      },
      required: ["answers"],
    },
  )) as { answers?: { question: number; answer: string }[] };

  return result.answers ?? [];
}

/** Transcribes listening-exam section audio so admin doesn't have to type it by hand — best-effort, always reviewable before saving. */
export async function transcribeAudio(audioBase64: string, mimeType: string): Promise<string> {
  const result = (await generateJson(
    [
      { text: "Transcribe this audio exactly as spoken, with standard punctuation. If nothing intelligible is present, return an empty string." },
      { inline_data: { mime_type: mimeType, data: audioBase64 } },
    ],
    {
      type: "OBJECT",
      properties: { transcript: { type: "STRING" } },
      required: ["transcript"],
    },
  )) as { transcript?: string };

  return typeof result.transcript === "string" ? result.transcript : "";
}

/** Suggests useful vocabulary (word + Uzbek meaning) drawn straight from a passage — admin reviews and picks which to add. */
export async function suggestWordsFromText(text: string): Promise<{ word: string; meaning: string }[]> {
  const result = (await generateJson(
    [
      {
        text: `Pick 8-12 useful or challenging words or short phrases from this passage for a language learner's vocabulary list. For each, give its Uzbek meaning. Use the word's base/dictionary form. Passage:\n\n${text}`,
      },
    ],
    {
      type: "OBJECT",
      properties: {
        words: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: { word: { type: "STRING" }, meaning: { type: "STRING" } },
            required: ["word", "meaning"],
          },
        },
      },
      required: ["words"],
    },
  )) as { words?: { word: string; meaning: string }[] };

  return result.words ?? [];
}

export type VocabSuggestion = {
  uzbek: string | null;
  synonym: string | null;
  example_sentence: string | null;
  difficulty: string | null;
};

/** Suggests translation/synonym/example/difficulty for an English word — admin can edit before saving, this just saves the first lookup. */
export async function suggestVocabWord(english: string): Promise<VocabSuggestion> {
  const result = (await generateJson(
    [
      {
        text: `You help build an English-Uzbek vocabulary list for language learners. For the English word or phrase "${english}": give its Uzbek translation, one common English synonym (omit if none fits well), one short natural example sentence using the word in English, and a difficulty level.`,
      },
    ],
    {
      type: "OBJECT",
      properties: {
        uzbek: { type: "STRING" },
        synonym: { type: "STRING" },
        example_sentence: { type: "STRING" },
        difficulty: { type: "STRING", enum: ["beginner", "intermediate", "advanced"] },
      },
      required: ["uzbek", "difficulty"],
    },
  )) as Partial<VocabSuggestion>;

  return {
    uzbek: typeof result.uzbek === "string" ? result.uzbek : null,
    synonym: typeof result.synonym === "string" ? result.synonym : null,
    example_sentence: typeof result.example_sentence === "string" ? result.example_sentence : null,
    difficulty: typeof result.difficulty === "string" ? result.difficulty : null,
  };
}
