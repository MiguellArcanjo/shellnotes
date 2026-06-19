export type CalloutKind = 'note' | 'tip' | 'warning' | 'danger' | 'info';

export type WriteupBlock =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'code'; language: string; code: string }
  | { type: 'image'; alt: string; src: string }
  | { type: 'flag'; value: string }
  | { type: 'unordered-list'; items: string[] }
  | { type: 'ordered-list'; items: string[] }
  | { type: 'task-list'; items: Array<{ text: string; checked: boolean }> }
  | { type: 'blockquote'; text: string }
  | { type: 'callout'; kind: CalloutKind; title: string; body: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'details'; summary: string; body: string }
  | { type: 'horizontal-rule' };

const CALLOUT_TITLES: Record<CalloutKind, string> = {
  note: 'Nota',
  tip: 'Dica',
  warning: 'Atenção',
  danger: 'Perigo',
  info: 'Informação',
};

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function isTableDivider(line: string): boolean {
  const cells = splitTableRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function isBlockStart(lines: string[], index: number): boolean {
  const line = lines[index] ?? '';
  const trimmed = line.trim();
  return (
    trimmed === '' ||
    line.startsWith('```') ||
    trimmed === ':::flag' ||
    trimmed.startsWith(':::details') ||
    /^#{1,3}\s+/.test(line) ||
    /^!\[[^\]]*\]\([^)]+\)$/.test(trimmed) ||
    /^>\s*\[!(note|tip|warning|danger|info)\]/i.test(line) ||
    /^>\s?/.test(line) ||
    /^[-*+]\s+\[[ xX]\]\s+/.test(line) ||
    /^[-*+]\s+/.test(line) ||
    /^\d+\.\s+/.test(line) ||
    /^ {0,3}([-*_])(?:\s*\1){2,}\s*$/.test(line) ||
    (line.includes('|') && isTableDivider(lines[index + 1] ?? ''))
  );
}

/**
 * Parser intentionally scoped to the Markdown dialect supported by the
 * shellnotes editor. It keeps the existing :::flag block while covering the
 * common GFM/Obsidian constructs exposed by the toolbar and slash menu.
 */
export function parseWriteupBody(raw: string): WriteupBlock[] {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const blocks: WriteupBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    if (line.startsWith('```')) {
      const language = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      blocks.push({ type: 'code', language, code: codeLines.join('\n') });
      continue;
    }

    if (trimmed === ':::flag') {
      const flagLines: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ':::') {
        flagLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      blocks.push({ type: 'flag', value: flagLines.join('\n').trim() });
      continue;
    }

    if (trimmed.startsWith(':::details')) {
      const summary = trimmed.slice(':::details'.length).trim() || 'Ver detalhes';
      const bodyLines: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ':::') {
        bodyLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      blocks.push({ type: 'details', summary, body: bodyLines.join('\n').trim() });
      continue;
    }

    const calloutMatch = /^>\s*\[!(note|tip|warning|danger|info)\](?:\s+(.*))?$/i.exec(line);
    if (calloutMatch) {
      const kind = calloutMatch[1].toLowerCase() as CalloutKind;
      const bodyLines: string[] = [];
      i++;
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        bodyLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({
        type: 'callout',
        kind,
        title: calloutMatch[2]?.trim() || CALLOUT_TITLES[kind],
        body: bodyLines.join('\n').trim(),
      });
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({ type: 'blockquote', text: quoteLines.join('\n') });
      continue;
    }

    const imageMatch = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(trimmed);
    if (imageMatch) {
      blocks.push({ type: 'image', alt: imageMatch[1], src: imageMatch[2] });
      i++;
      continue;
    }

    const headingMatch = /^(#{1,3})\s+(.*)$/.exec(line);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length as 1 | 2 | 3,
        text: headingMatch[2],
      });
      i++;
      continue;
    }

    if (/^ {0,3}([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
      blocks.push({ type: 'horizontal-rule' });
      i++;
      continue;
    }

    if (/^[-*+]\s+\[[ xX]\]\s+/.test(line)) {
      const items: Array<{ text: string; checked: boolean }> = [];
      while (i < lines.length) {
        const match = /^[-*+]\s+\[([ xX])\]\s+(.*)$/.exec(lines[i]);
        if (!match) break;
        items.push({ checked: match[1].toLowerCase() === 'x', text: match[2] });
        i++;
      }
      blocks.push({ type: 'task-list', items });
      continue;
    }

    if (/^[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length) {
        const match = /^[-*+]\s+(.*)$/.exec(lines[i]);
        if (!match || /^\[[ xX]\]\s+/.test(match[1])) break;
        items.push(match[1]);
        i++;
      }
      blocks.push({ type: 'unordered-list', items });
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length) {
        const match = /^\d+\.\s+(.*)$/.exec(lines[i]);
        if (!match) break;
        items.push(match[1]);
        i++;
      }
      blocks.push({ type: 'ordered-list', items });
      continue;
    }

    if (line.includes('|') && isTableDivider(lines[i + 1] ?? '')) {
      const headers = splitTableRow(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        rows.push(splitTableRow(lines[i]));
        i++;
      }
      blocks.push({ type: 'table', headers, rows });
      continue;
    }

    const paragraphLines: string[] = [trimmed];
    i++;
    while (i < lines.length && !isBlockStart(lines, i)) {
      paragraphLines.push(lines[i].trim());
      i++;
    }
    blocks.push({ type: 'paragraph', text: paragraphLines.join('\n') });
  }

  return blocks;
}
