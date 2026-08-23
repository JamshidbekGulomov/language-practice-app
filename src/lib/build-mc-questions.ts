export type MCQuestion = { id: string; word: string; correct: string; options: string[] };

type WordWithMeaning = { id: string; word: string; meaning: string | null };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildMultipleChoiceQuestions(
  words: WordWithMeaning[],
  roundSize = 8,
): MCQuestion[] {
  const withMeaning = words.filter(
    (w): w is WordWithMeaning & { meaning: string } => !!w.meaning,
  );
  if (withMeaning.length < 4) return [];

  const pool = shuffle(withMeaning).slice(0, Math.min(roundSize, withMeaning.length));

  return pool.map((w) => {
    const distractors = shuffle(withMeaning.filter((o) => o.id !== w.id))
      .slice(0, 3)
      .map((o) => o.meaning);
    const options = shuffle([w.meaning, ...distractors]);
    return { id: w.id, word: w.word, correct: w.meaning, options };
  });
}
