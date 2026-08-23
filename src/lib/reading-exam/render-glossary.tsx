import type { GlossaryTerm } from "@/lib/reading-exam/types";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Splits paragraph text on glossary word matches (case-insensitive, whole
 * word) so the caller can render the matches as clickable spans. Returns a
 * flat list alternating plain strings and { term } markers.
 */
export function splitOnGlossary(
  text: string,
  glossary: GlossaryTerm[],
): (string | { term: GlossaryTerm })[] {
  const terms = glossary.filter((g) => g.word.trim());
  if (terms.length === 0) return [text];

  const pattern = new RegExp(`\\b(${terms.map((t) => escapeRegExp(t.word)).join("|")})\\b`, "gi");
  const parts: (string | { term: GlossaryTerm })[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const term = terms.find((t) => t.word.toLowerCase() === match![0].toLowerCase());
    if (term) parts.push({ term });
    else parts.push(match[0]);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}
