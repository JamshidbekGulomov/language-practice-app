export type TranscriptToken =
  | { type: "text"; value: string }
  | { type: "blank"; id: string; answer: string };

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Blanks out the first occurrence of each vocab word in the transcript
 * (case-insensitive, whole-word match). Words not found in the text are
 * skipped — the admin's transcript and vocab list don't have to line up
 * perfectly.
 */
export function buildFillBlankTemplate(
  transcript: string,
  words: { id: string; word: string }[],
): TranscriptToken[] {
  const remaining = new Map(words.map((w) => [w.word.toLowerCase(), w]));
  if (remaining.size === 0) return [{ type: "text", value: transcript }];

  const pattern = new RegExp(
    `\\b(${[...remaining.keys()].map(escapeRegExp).join("|")})\\b`,
    "gi",
  );

  const tokens: TranscriptToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(transcript))) {
    const key = match[0].toLowerCase();
    const wordEntry = remaining.get(key);
    if (!wordEntry) continue;

    tokens.push({ type: "text", value: transcript.slice(lastIndex, match.index) });
    tokens.push({ type: "blank", id: wordEntry.id, answer: wordEntry.word });
    remaining.delete(key);
    lastIndex = match.index + match[0].length;

    if (remaining.size === 0) break;
  }

  tokens.push({ type: "text", value: transcript.slice(lastIndex) });
  return tokens;
}
