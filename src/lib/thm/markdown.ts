// Tiny, dependency-free Markdown -> HTML renderer for the study notes preview.
// Input is escaped first, so the output is safe to inject. Supports the subset
// that matters for study notes: headings, bold/italic, inline + fenced code,
// links, blockquotes, unordered/ordered lists and paragraphs.

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Escapes HTML first (so user input can't inject markup), then applies inline
// markdown. Block structure is detected on the raw line by the caller.
function inline(text: string): string {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

export function renderMarkdown(source: string): string {
  const lines = source.split('\n');
  const html: string[] = [];
  let inCode = false;
  let listType: 'ul' | 'ol' | null = null;

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  };

  for (const raw of lines) {
    const line = raw;

    if (line.trim().startsWith('```')) {
      if (inCode) {
        html.push('</code></pre>');
        inCode = false;
      } else {
        closeList();
        html.push('<pre><code>');
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      html.push(`${escapeHtml(line)}\n`);
      continue;
    }

    if (/^#{1,6}\s/.test(line)) {
      closeList();
      const level = line.match(/^#+/)![0].length;
      html.push(`<h${level}>${inline(line.replace(/^#+\s/, ''))}</h${level}>`);
      continue;
    }
    if (/^>\s?/.test(line)) {
      closeList();
      html.push(`<blockquote>${inline(line.replace(/^>\s?/, ''))}</blockquote>`);
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      if (listType !== 'ul') {
        closeList();
        html.push('<ul>');
        listType = 'ul';
      }
      html.push(`<li>${inline(line.replace(/^\s*[-*]\s+/, ''))}</li>`);
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      if (listType !== 'ol') {
        closeList();
        html.push('<ol>');
        listType = 'ol';
      }
      html.push(`<li>${inline(line.replace(/^\s*\d+\.\s+/, ''))}</li>`);
      continue;
    }
    if (line.trim() === '') {
      closeList();
      continue;
    }
    closeList();
    html.push(`<p>${inline(line)}</p>`);
  }

  if (inCode) html.push('</code></pre>');
  closeList();
  return html.join('\n');
}

// Markdown toolbar actions: given the current value + selection, return the new
// value and the caret/selection to restore. Pure so it's easy to test/reuse.
export type MdAction = 'bold' | 'italic' | 'code' | 'codeblock' | 'h2' | 'list' | 'olist' | 'quote' | 'link';

export function applyMarkdown(
  value: string,
  start: number,
  end: number,
  action: MdAction,
): { value: string; selStart: number; selEnd: number } {
  const selected = value.slice(start, end);
  const before = value.slice(0, start);
  const after = value.slice(end);

  const wrap = (left: string, right: string, placeholder: string) => {
    const inner = selected || placeholder;
    const next = `${before}${left}${inner}${right}${after}`;
    return { value: next, selStart: start + left.length, selEnd: start + left.length + inner.length };
  };

  const linePrefix = (prefix: string, placeholder: string) => {
    const inner = selected || placeholder;
    const prefixed = inner
      .split('\n')
      .map((line) => `${prefix}${line}`)
      .join('\n');
    const next = `${before}${prefixed}${after}`;
    return { value: next, selStart: start, selEnd: start + prefixed.length };
  };

  switch (action) {
    case 'bold':
      return wrap('**', '**', 'texto');
    case 'italic':
      return wrap('*', '*', 'texto');
    case 'code':
      return wrap('`', '`', 'código');
    case 'codeblock':
      return wrap('\n```\n', '\n```\n', 'cole o comando/saída');
    case 'h2':
      return linePrefix('## ', 'Título');
    case 'list':
      return linePrefix('- ', 'item');
    case 'olist':
      return linePrefix('1. ', 'item');
    case 'quote':
      return linePrefix('> ', 'citação');
    case 'link':
      return wrap('[', '](https://)', 'texto do link');
    default:
      return { value, selStart: start, selEnd: end };
  }
}
