import "server-only";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  return key;
}

async function generateJson(parts: object[]): Promise<unknown> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`Gemini request failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no content");
  return JSON.parse(text);
}

export type SpeakingAnalysis = { transcript: string; feedback: string };

/** Transcribes a recording and gives brief written feedback — best-effort, not a substitute for teacher review. */
export async function analyzeSpeakingAudio(
  audioBase64: string,
  mimeType: string,
): Promise<SpeakingAnalysis> {
  const result = (await generateJson([
    {
      text: "You are a language-learning assistant. Listen to this spoken answer and respond with strict JSON only: {\"transcript\": string, \"feedback\": string}. \"transcript\" is a verbatim transcription of what was said. \"feedback\" is 2-4 sentences of constructive feedback for the learner, covering grammar, vocabulary, and fluency. If nothing intelligible was said, say so in both fields.",
    },
    { inline_data: { mime_type: mimeType, data: audioBase64 } },
  ])) as Partial<SpeakingAnalysis>;

  return {
    transcript: typeof result.transcript === "string" ? result.transcript : "",
    feedback: typeof result.feedback === "string" ? result.feedback : "",
  };
}

export type VocabSuggestion = {
  uzbek: string | null;
  synonym: string | null;
  example_sentence: string | null;
  difficulty: string | null;
};

/** Suggests translation/synonym/example/difficulty for an English word — admin can edit before saving, this just saves the first lookup. */
export async function suggestVocabWord(english: string): Promise<VocabSuggestion> {
  const result = (await generateJson([
    {
      text: `You help build an English-Uzbek vocabulary list for language learners. For the English word or phrase "${english}", respond with strict JSON only: {"uzbek": string, "synonym": string | null, "example_sentence": string | null, "difficulty": string}. "uzbek" is its Uzbek translation. "synonym" is one common English synonym, or null if none fits well. "example_sentence" is one short natural example sentence using the word in English. "difficulty" is one of "beginner", "intermediate", or "advanced".`,
    },
  ])) as Partial<VocabSuggestion>;

  return {
    uzbek: typeof result.uzbek === "string" ? result.uzbek : null,
    synonym: typeof result.synonym === "string" ? result.synonym : null,
    example_sentence: typeof result.example_sentence === "string" ? result.example_sentence : null,
    difficulty: typeof result.difficulty === "string" ? result.difficulty : null,
  };
}
