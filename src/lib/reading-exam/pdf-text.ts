import * as pdfjsLib from "pdfjs-dist";
import type { TextItem } from "pdfjs-dist/types/src/display/api";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export type PdfTextExtraction = {
  /** Best-effort paragraph split, used to pre-fill the passage editor's paragraph rows. */
  paragraphs: { letter: string; text: string }[];
  /**
   * The full extracted text, in reading order — passage AND questions,
   * whatever the PDF contains. Paragraph-splitting only knows how to guess
   * at passage structure, so when a PDF has its questions in the same
   * file, this is where the admin finds and copies them from: matching
   * headings/statements, summary text, answer options, etc.
   */
  fullText: string;
};

/**
 * Extracts plain text from a PDF entirely in the browser — no AI, no
 * server round-trip, so no risk of the Vercel function-duration crash the
 * PDF-analysis feature hit. Reconstructs line breaks from each text
 * item's vertical position (pdf.js otherwise returns one flat run of
 * words per page), then splits into paragraphs on lettered markers
 * ("A ", "B ", ...) if the passage uses them, or blank-line gaps
 * otherwise. This only gets the raw text in front of the admin — unlike
 * the AI path, it does not identify glossary terms, question groups, or
 * answers; those are still filled in by hand in the structured editor.
 */
export async function extractPdfText(file: File): Promise<PdfTextExtraction> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  const lines: string[] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    let currentLine = "";
    let lastY: number | null = null;

    for (const raw of content.items) {
      const item = raw as TextItem;
      if (!("str" in item)) continue;
      const y = item.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        if (currentLine.trim()) lines.push(currentLine.trim());
        currentLine = "";
      }
      currentLine += item.str + (item.hasEOL ? "" : " ");
      lastY = y;
    }
    if (currentLine.trim()) lines.push(currentLine.trim());
    lines.push(`--- page ${pageNum} end ---`, "");
  }

  const fullText = lines.join("\n").trim();

  const letterMarker = /^([A-H])[\s.]+(.*)/;
  const lettered = lines.filter((l) => letterMarker.test(l));

  if (lettered.length >= 2) {
    const paragraphs: { letter: string; text: string }[] = [];
    let current: { letter: string; text: string } | null = null;
    for (const line of lines) {
      const match = line.match(letterMarker);
      if (match) {
        if (current) paragraphs.push(current);
        current = { letter: match[1], text: match[2] };
      } else if (current && line.trim() && !line.startsWith("---")) {
        current.text += " " + line.trim();
      }
    }
    if (current) paragraphs.push(current);
    return { paragraphs, fullText };
  }

  const blocks: string[] = [];
  let block = "";
  for (const line of lines) {
    if (!line.trim() || line.startsWith("---")) {
      if (block.trim()) blocks.push(block.trim());
      block = "";
    } else {
      block += (block ? " " : "") + line.trim();
    }
  }
  if (block.trim()) blocks.push(block.trim());

  return { paragraphs: blocks.map((text, i) => ({ letter: String.fromCharCode(65 + i), text })), fullText };
}
