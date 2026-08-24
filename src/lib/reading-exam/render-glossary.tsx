import type { GlossaryTerm } from "@/lib/reading-exam/types";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type HighlightRange = { start: number; end: number };

export type PassageSegment = {
  text: string;
  start: number;
  end: number;
  term?: GlossaryTerm;
  highlighted: boolean;
};

function glossaryRanges(text: string, glossary: GlossaryTerm[]): { start: number; end: number; term: GlossaryTerm }[] {
  const terms = glossary.filter((g) => g.word.trim());
  if (terms.length === 0) return [];

  const pattern = new RegExp(`\\b(${terms.map((t) => escapeRegExp(t.word)).join("|")})\\b`, "gi");
  const ranges: { start: number; end: number; term: GlossaryTerm }[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const term = terms.find((t) => t.word.toLowerCase() === match![0].toLowerCase());
    if (term) ranges.push({ start: match.index, end: match.index + match[0].length, term });
  }
  return ranges;
}

/**
 * Splits paragraph text into atomic segments tagged with whether each one
 * falls inside a glossary match and/or a user-made highlight, by merging
 * the two independent range sets on their combined breakpoints. Lets the
 * caller render both a clickable glossary span and a highlighted
 * background on the same run of text without one clobbering the other.
 */
export function renderPassageSegments(
  text: string,
  glossary: GlossaryTerm[],
  highlights: HighlightRange[],
): PassageSegment[] {
  const gRanges = glossaryRanges(text, glossary);
  const points = new Set<number>([0, text.length]);
  for (const r of gRanges) {
    points.add(r.start);
    points.add(r.end);
  }
  for (const r of highlights) {
    points.add(Math.max(0, r.start));
    points.add(Math.min(text.length, r.end));
  }

  const sorted = [...points].sort((a, b) => a - b);
  const segments: PassageSegment[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const start = sorted[i];
    const end = sorted[i + 1];
    if (start >= end) continue;
    const term = gRanges.find((r) => r.start <= start && r.end >= end)?.term;
    const highlighted = highlights.some((r) => r.start <= start && r.end >= end);
    segments.push({ text: text.slice(start, end), start, end, term, highlighted });
  }
  return segments;
}

/** Computes the plain-text character offset of a DOM point relative to a root element. */
export function textOffsetWithin(root: Node, node: Node, offset: number): number {
  const range = document.createRange();
  range.selectNodeContents(root);
  range.setEnd(node, offset);
  return range.toString().length;
}
