import "server-only";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  return key;
}

async function generateJson(parts: object[], responseSchema: object): Promise<unknown> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseMimeType: "application/json", responseSchema },
      }),
    },
  );
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

export type ReadingExamAiDraft = {
  title: string;
  subtitle: string;
  paragraphs: { letter: string; text: string }[];
  glossary: { word: string; def: string; syn: string; uz: string }[];
  matching_headings: {
    present: boolean;
    label: string;
    startQuestion: number;
    headings: { code: string; label: string }[];
    items: { paragraphLetter: string; answerCode: string }[];
  };
  matching_features: {
    present: boolean;
    label: string;
    startQuestion: number;
    statements: { code: string; text: string }[];
    items: { personOrFeature: string; answerCode: string }[];
  };
  summary_completion: {
    present: boolean;
    label: string;
    startQuestion: number;
    title: string;
    text: string;
    answers: { question: number; answer: string }[];
  };
  paraphrase_pairs: { keyword: string; phrase: string }[];
};

/**
 * Reads an uploaded reading-exam PDF (passage + questions) and extracts a
 * full structured draft: paragraphs, glossary, the three supported question
 * types (matching headings / matching features / summary completion), and
 * paraphrase-practice pairs. Since exam PDFs rarely print an answer key,
 * Gemini also answers each question itself from the extracted passage —
 * best-effort, always reviewed by the admin before anything is published.
 */
export async function analyzeReadingExamPdf(pdfBase64: string): Promise<ReadingExamAiDraft> {
  const groupProps = {
    present: { type: "BOOLEAN" },
    label: { type: "STRING" },
    startQuestion: { type: "INTEGER" },
  };

  const result = (await generateJson(
    [
      {
        text: `You are building a computer-delivered IELTS/CEFR-style reading exam practice page from an uploaded exam PDF.

1. Extract the passage: a title, an optional italic subtitle/intro line, and its paragraphs split by their existing letter labels (A, B, C, ...). If paragraphs aren't lettered in the source, assign letters A, B, C... in order.
2. Pick 6-10 useful or challenging words from the passage for a glossary: a plain-English definition, one or two synonyms, and an Uzbek translation for each.
3. Identify which of these three question types appear in the questions, and extract each fully (leave "present": false and empty arrays for any type that isn't used):
   - matching_headings: choosing a heading for each paragraph from a list of heading options (more options than paragraphs). For each item give the paragraph's letter and the correct heading's code.
   - matching_features: matching a list of people/features to statements about them, from a list of statements (usually more statements than items). For each item give the person/feature name and the correct statement's code (A, B, C...).
   - summary_completion: a short summary paragraph with numbered blanks. Return its text with each blank replaced by "{{N}}" where N is that question's number, plus the correct answer (usually one or a few words from the passage) for each blank.
   For matching_headings and matching_features, give "startQuestion" as the first question number in that group; items are ordered so question numbers run startQuestion, startQuestion+1, ... in the order you list them.
4. The PDF likely has no answer key. Answer every question yourself, carefully, using only the passage text, the way a strong test-taker would.
5. Also produce 4-8 "paraphrase_pairs": a key word or short phrase taken from one of the questions, paired with the word/phrase in the passage that means the same thing (the paraphrase a student would need to spot). Use exact wording from the passage for "phrase".

Return only the structured data — no commentary.`,
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
            ...groupProps,
            headings: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: { code: { type: "STRING" }, label: { type: "STRING" } },
                required: ["code", "label"],
              },
            },
            items: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: { paragraphLetter: { type: "STRING" }, answerCode: { type: "STRING" } },
                required: ["paragraphLetter", "answerCode"],
              },
            },
          },
          required: ["present"],
        },
        matching_features: {
          type: "OBJECT",
          properties: {
            ...groupProps,
            statements: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: { code: { type: "STRING" }, text: { type: "STRING" } },
                required: ["code", "text"],
              },
            },
            items: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: { personOrFeature: { type: "STRING" }, answerCode: { type: "STRING" } },
                required: ["personOrFeature", "answerCode"],
              },
            },
          },
          required: ["present"],
        },
        summary_completion: {
          type: "OBJECT",
          properties: {
            ...groupProps,
            title: { type: "STRING" },
            text: { type: "STRING" },
            answers: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: { question: { type: "INTEGER" }, answer: { type: "STRING" } },
                required: ["question", "answer"],
              },
            },
          },
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
  )) as Partial<ReadingExamAiDraft>;

  return {
    title: result.title ?? "",
    subtitle: result.subtitle ?? "",
    paragraphs: result.paragraphs ?? [],
    glossary: result.glossary ?? [],
    matching_headings: result.matching_headings ?? { present: false, label: "Matching Headings", startQuestion: 1, headings: [], items: [] },
    matching_features: result.matching_features ?? { present: false, label: "Matching Features", startQuestion: 1, statements: [], items: [] },
    summary_completion: result.summary_completion ?? { present: false, label: "Summary Completion", startQuestion: 1, title: "", text: "", answers: [] },
    paraphrase_pairs: result.paraphrase_pairs ?? [],
  };
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
