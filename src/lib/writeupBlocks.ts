export type WriteupBlock =
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'code'; language: string; code: string }
  | { type: 'image'; alt: string; src: string }
  | { type: 'flag'; value: string };

/**
 * Tiny hand-rolled parser for shellnotes' writeup body syntax: plain
 * paragraphs, "## "/"### " headings, fenced ``` code blocks, markdown image
 * syntax, and a custom :::flag ... ::: spoiler block. Not general markdown —
 * just the handful of constructs the editor's toolbar can insert.
 */
export function parseWriteupBody(raw: string): WriteupBlock[] {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const blocks: WriteupBlock[] = [];
  let paragraphBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length > 0) {
      blocks.push({ type: 'paragraph', text: paragraphBuffer.join(' ') });
      paragraphBuffer = [];
    }
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') {
      flushParagraph();
      i++;
      continue;
    }

    if (line.startsWith('```')) {
      flushParagraph();
      const language = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      blocks.push({ type: 'code', language, code: codeLines.join('\n') });
      continue;
    }

    if (line.trim() === ':::flag') {
      flushParagraph();
      const flagLines: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ':::') {
        flagLines.push(lines[i]);
        i++;
      }
      i++; // skip closing :::
      blocks.push({ type: 'flag', value: flagLines.join('\n').trim() });
      continue;
    }

    const imageMatch = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(line.trim());
    if (imageMatch) {
      flushParagraph();
      blocks.push({ type: 'image', alt: imageMatch[1], src: imageMatch[2] });
      i++;
      continue;
    }

    const headingMatch = /^(#{2,3})\s+(.*)$/.exec(line);
    if (headingMatch) {
      flushParagraph();
      blocks.push({ type: 'heading', level: headingMatch[1].length as 2 | 3, text: headingMatch[2] });
      i++;
      continue;
    }

    paragraphBuffer.push(line.trim());
    i++;
  }
  flushParagraph();

  return blocks;
}
