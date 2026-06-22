'use client';

import { Bold, Code, Heading2, Italic, Link2, List, ListOrdered, Quote, SquareCode } from 'lucide-react';
import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { renderMarkdown } from '@/lib/thm/markdown';
import styles from './Thm.module.css';

export function toInitialHtml(raw: string): string {
  if (!raw) return '';
  return /<\/?[a-z][\s\S]*>/i.test(raw) ? raw : renderMarkdown(raw);
}

export function htmlToText(html: string): string {
  if (typeof document === 'undefined') return html.replace(/<[^>]+>/g, ' ');
  const div = document.createElement('div');
  div.innerHTML = html;
  div.querySelectorAll('h1,h2,h3,h4,p,li,blockquote,pre,div,br').forEach((el) => el.append('\n'));
  return (div.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
}

function getBlock(editor: HTMLElement): HTMLElement {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return editor;
  let node: Node | null = selection.anchorNode;
  if (!node || node === editor) return editor;
  while (node && node.parentNode && node.parentNode !== editor) node = node.parentNode;
  return node?.nodeType === 1 ? node as HTMLElement : editor;
}

function ancestor(editor: HTMLElement, node: Node | null, tags: string[]): HTMLElement | null {
  let current = node;
  while (current && current !== editor) {
    if (current.nodeType === 1 && tags.includes((current as HTMLElement).tagName)) return current as HTMLElement;
    current = current.parentNode;
  }
  return null;
}

type Active = {
  bold: boolean;
  italic: boolean;
  ul: boolean;
  ol: boolean;
  h: string;
  quote: boolean;
  inlineCode: boolean;
  codeBlock: boolean;
};

const NO_ACTIVE: Active = {
  bold: false,
  italic: false,
  ul: false,
  ol: false,
  h: '',
  quote: false,
  inlineCode: false,
  codeBlock: false,
};

const FORMAT_LABELS: Record<string, string> = {
  h1: 'Título 1',
  h2: 'Título 2',
  h3: 'Título 3',
  blockquote: 'Citação',
  pre: 'Bloco de código',
  ul: 'Lista',
  ol: 'Lista numerada',
  p: 'Texto',
  div: 'Texto',
};

export function LiveEditor({
  initialHtml,
  onChange,
  placeholder,
}: {
  initialHtml: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [empty, setEmpty] = useState(!initialHtml.trim());
  const [active, setActive] = useState<Active>(NO_ACTIVE);
  const [selectionCount, setSelectionCount] = useState(0);
  const [blockLabel, setBlockLabel] = useState('Texto');

  useEffect(() => {
    const editor = ref.current;
    if (!editor) return;
    editor.innerHTML = initialHtml.trim() ? initialHtml : '<p><br></p>';
    try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch { /* noop */ }
    // The editor stays uncontrolled after its initial value is installed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshActive = useCallback(() => {
    const editor = ref.current;
    const selection = window.getSelection();
    if (!editor || !selection?.anchorNode || !editor.contains(selection.anchorNode)) return;

    const state = (command: string) => {
      try { return document.queryCommandState(command); } catch { return false; }
    };
    let formatBlock = '';
    try { formatBlock = String(document.queryCommandValue('formatBlock') || '').toLowerCase(); } catch { /* noop */ }

    const topBlock = getBlock(editor);
    const inPre = Boolean(ancestor(editor, selection.anchorNode, ['PRE']));
    const tag = inPre ? 'pre' : topBlock === editor ? 'p' : topBlock.tagName.toLowerCase();
    setBlockLabel(FORMAT_LABELS[tag] ?? 'Texto');
    setSelectionCount(selection.isCollapsed ? 0 : selection.toString().length);
    setActive({
      bold: state('bold'),
      italic: state('italic'),
      ul: state('insertUnorderedList'),
      ol: state('insertOrderedList'),
      h: /^h[1-3]$/.test(formatBlock) ? formatBlock : '',
      quote: formatBlock === 'blockquote',
      inlineCode: !inPre && Boolean(ancestor(editor, selection.anchorNode, ['CODE'])),
      codeBlock: inPre,
    });
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', refreshActive);
    return () => document.removeEventListener('selectionchange', refreshActive);
  }, [refreshActive]);

  const emit = () => {
    const editor = ref.current;
    if (!editor) return;
    const text = (editor.textContent || '').trim();
    setEmpty(!text);
    onChange(text ? editor.innerHTML : '');
  };

  const afterFormat = () => {
    emit();
    window.requestAnimationFrame(refreshActive);
  };

  const exec = (command: string, value?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, value);
    afterFormat();
  };

  const formatBlock = (tag: string) => {
    const lower = tag.toLowerCase();
    const isActive = lower === 'blockquote' ? active.quote : active.h === lower;
    exec('formatBlock', isActive ? 'P' : tag);
  };

  const wrapCode = () => {
    const editor = ref.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0 || selection.isCollapsed) {
      editor?.focus();
      return;
    }

    const currentCode = ancestor(editor, selection.anchorNode, ['CODE']);
    if (currentCode && !ancestor(editor, selection.anchorNode, ['PRE'])) {
      currentCode.replaceWith(...Array.from(currentCode.childNodes));
      afterFormat();
      return;
    }

    const range = selection.getRangeAt(0);
    const code = document.createElement('code');
    try {
      range.surroundContents(code);
    } catch {
      code.appendChild(range.extractContents());
      range.insertNode(code);
    }
    afterFormat();
  };

  const placeCaretAtEnd = (element: HTMLElement) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  const insertCodeBlock = () => {
    const editor = ref.current;
    if (!editor) return;
    const block = getBlock(editor);

    if (block.tagName === 'PRE') {
      const paragraph = document.createElement('p');
      paragraph.textContent = block.textContent || '';
      block.replaceWith(paragraph);
      placeCaretAtEnd(paragraph);
      afterFormat();
      return;
    }

    const pre = document.createElement('pre');
    const code = document.createElement('code');
    const content = block === editor ? '' : block.textContent || '';
    if (content) code.textContent = content;
    else code.appendChild(document.createElement('br'));
    pre.appendChild(code);
    if (block === editor || !block.parentNode) editor.appendChild(pre);
    else block.replaceWith(pre);
    placeCaretAtEnd(code);
    afterFormat();
  };

  const addLink = () => {
    const url = window.prompt('URL do link:');
    if (url) exec('createLink', url);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const editor = ref.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) return;

    if (event.key === 'Enter') {
      const pre = ancestor(editor, selection.anchorNode, ['PRE']);
      if (!pre) return;
      event.preventDefault();
      const text = pre.textContent || '';
      if (text.endsWith('\n') || text === '') {
        const code = pre.querySelector('code') ?? pre;
        code.textContent = (code.textContent || '').replace(/\n$/, '');
        const paragraph = document.createElement('p');
        paragraph.appendChild(document.createElement('br'));
        pre.after(paragraph);
        placeCaretAtEnd(paragraph);
      } else {
        document.execCommand('insertText', false, '\n');
      }
      afterFormat();
      return;
    }

    if (event.key !== ' ' || !selection.isCollapsed) return;
    const block = getBlock(editor);
    const caret = selection.getRangeAt(0);
    const beforeRange = document.createRange();
    beforeRange.selectNodeContents(block);
    beforeRange.setEnd(caret.startContainer, caret.startOffset);
    const before = beforeRange.toString();

    const actions: Record<string, () => void> = {
      '#': () => exec('formatBlock', 'H1'),
      '##': () => exec('formatBlock', 'H2'),
      '###': () => exec('formatBlock', 'H3'),
      '>': () => exec('formatBlock', 'BLOCKQUOTE'),
      '-': () => exec('insertUnorderedList'),
      '*': () => exec('insertUnorderedList'),
      '1.': () => exec('insertOrderedList'),
      '```': insertCodeBlock,
    };
    const action = actions[before];
    if (action) {
      event.preventDefault();
      beforeRange.deleteContents();
      action();
      return;
    }

    if (caret.startContainer.nodeType !== Node.TEXT_NODE) return;
    const textNode = caret.startContainer as Text;
    const textBeforeCaret = textNode.data.slice(0, caret.startOffset);
    const inlineRules: Array<{ pattern: RegExp; tag: 'strong' | 'em' | 'code' }> = [
      { pattern: /\*\*([^*\n]+)\*\*$/, tag: 'strong' },
      { pattern: /(^|[^*])\*([^*\n]+)\*$/, tag: 'em' },
      { pattern: /`([^`\n]+)`$/, tag: 'code' },
    ];
    const rule = inlineRules.find((candidate) => candidate.pattern.test(textBeforeCaret));
    const match = rule ? textBeforeCaret.match(rule.pattern) : null;
    if (!rule || !match) return;

    event.preventDefault();
    const matchedText = rule.tag === 'em' ? match[2] : match[1];
    const markerLength = rule.tag === 'em' ? match[0].length - (match[1]?.length ?? 0) : match[0].length;
    const replace = document.createRange();
    replace.setStart(textNode, caret.startOffset - markerLength);
    replace.setEnd(textNode, caret.startOffset);
    replace.deleteContents();
    const formatted = document.createElement(rule.tag);
    formatted.textContent = matchedText;
    const spacer = document.createTextNode('\u00a0');
    replace.insertNode(spacer);
    replace.insertNode(formatted);
    const next = document.createRange();
    next.setStartAfter(spacer);
    next.collapse(true);
    selection.removeAllRanges();
    selection.addRange(next);
    afterFormat();
  };

  const noBlur = (event: { preventDefault: () => void }) => event.preventDefault();
  const cls = (on: boolean) => on ? styles.mdOn : undefined;

  return (
    <section className={`${styles.block} ${styles.editorBlock}`}>
      <div className={styles.mdToolbar}>
        <div className={styles.mdTitle}>
          <span>Anotações</span>
          <small>formatação ao vivo</small>
        </div>
        <div className={styles.mdActions}>
          <button type="button" aria-label="Negrito" aria-pressed={active.bold} className={cls(active.bold)} title="Negrito (Ctrl+B)" onMouseDown={noBlur} onClick={() => exec('bold')}><Bold size={15} /><span>Negrito</span></button>
          <button type="button" aria-label="Itálico" aria-pressed={active.italic} className={cls(active.italic)} title="Itálico (Ctrl+I)" onMouseDown={noBlur} onClick={() => exec('italic')}><Italic size={15} /><span>Itálico</span></button>
          <span className={styles.mdSep} />
          <button type="button" aria-label="Título" aria-pressed={active.h === 'h2'} className={cls(active.h === 'h2')} title="Título" onMouseDown={noBlur} onClick={() => formatBlock('H2')}><Heading2 size={15} /><span>Título</span></button>
          <button type="button" aria-label="Citação" aria-pressed={active.quote} className={cls(active.quote)} title="Citação" onMouseDown={noBlur} onClick={() => formatBlock('BLOCKQUOTE')}><Quote size={15} /><span>Citação</span></button>
          <span className={styles.mdSep} />
          <button type="button" aria-label="Lista" aria-pressed={active.ul} className={cls(active.ul)} title="Lista" onMouseDown={noBlur} onClick={() => exec('insertUnorderedList')}><List size={15} /><span>Lista</span></button>
          <button type="button" aria-label="Lista numerada" aria-pressed={active.ol} className={cls(active.ol)} title="Lista numerada" onMouseDown={noBlur} onClick={() => exec('insertOrderedList')}><ListOrdered size={15} /><span>Numerada</span></button>
          <span className={styles.mdSep} />
          <button type="button" aria-label="Código inline" aria-pressed={active.inlineCode} className={cls(active.inlineCode)} title="Código inline" onMouseDown={noBlur} onClick={wrapCode}><Code size={15} /><span>Código</span></button>
          <button type="button" aria-label="Bloco de código" aria-pressed={active.codeBlock} className={cls(active.codeBlock)} title="Bloco de código" onMouseDown={noBlur} onClick={insertCodeBlock}><SquareCode size={15} /><span>Bloco</span></button>
          <button type="button" aria-label="Link" title="Link" onMouseDown={noBlur} onClick={addLink}><Link2 size={15} /><span>Link</span></button>
        </div>
      </div>
      <div className={styles.liveWrap}>
        {empty && placeholder && <div className={styles.livePlaceholder}>{placeholder}</div>}
        <div
          ref={ref}
          className={styles.liveEditor}
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onKeyDown={onKeyDown}
          spellCheck={false}
        />
      </div>
      <div className={styles.mdFooter}>
        <span className={styles.mdStatus}><strong>{blockLabel}</strong>{selectionCount > 0 ? ` · ${selectionCount} selecionado${selectionCount === 1 ? '' : 's'}` : ''}</span>
        <span className={styles.mdHint}><code># </code> título <b>·</b> <code>- </code> lista <b>·</b> <code>&gt; </code> citação <b>·</b> <code>``` </code> código</span>
      </div>
    </section>
  );
}
