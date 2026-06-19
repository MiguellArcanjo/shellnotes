import Link from 'next/link';
import {
  AlertTriangle,
  CircleAlert,
  Info,
  Lightbulb,
  NotebookPen,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { parseWriteupBody, type CalloutKind } from '@/lib/writeupBlocks';
import { slugify } from '@/lib/slugify';
import CodeBlock from './CodeBlock';
import FlagBlock from './FlagBlock';
import styles from './Writeups.module.css';

const INLINE_PATTERNS = [
  { kind: 'code', regex: /`([^`\n]+)`/ },
  { kind: 'wikilink', regex: /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/ },
  { kind: 'link', regex: /\[([^\]]+)\]\(([^)\s]+)\)/ },
  { kind: 'bold', regex: /\*\*([^*\n]+)\*\*/ },
  { kind: 'strike', regex: /~~([^~\n]+)~~/ },
  { kind: 'highlight', regex: /==([^=\n]+)==/ },
  { kind: 'italic', regex: /(?<!\*)\*([^*\n]+)\*(?!\*)/ },
] as const;

function safeHref(href: string): string {
  return /^(https?:\/\/|mailto:|\/|#)/i.test(href) ? href : '#';
}

function renderInline(text: string, keyPrefix = 'inline'): ReactNode[] {
  const nodes: ReactNode[] = [];
  let remaining = text;
  let index = 0;

  while (remaining) {
    const matches = INLINE_PATTERNS
      .map((pattern) => ({ ...pattern, match: pattern.regex.exec(remaining) }))
      .filter((entry) => entry.match)
      .sort((a, b) => (a.match?.index ?? 0) - (b.match?.index ?? 0));
    const next = matches[0];

    if (!next?.match) {
      nodes.push(remaining);
      break;
    }

    if (next.match.index > 0) nodes.push(remaining.slice(0, next.match.index));
    const key = `${keyPrefix}-${index++}`;
    const value = next.match[1];

    switch (next.kind) {
      case 'code':
        nodes.push(<code key={key} className={styles.inlineCode}>{value}</code>);
        break;
      case 'wikilink': {
        const target = value.trim();
        const label = next.match[2]?.trim() || target;
        nodes.push(
          <Link key={key} href={`/writeups/${slugify(target)}`} className={styles.wikiLink}>
            {label}
          </Link>,
        );
        break;
      }
      case 'link': {
        const href = safeHref(next.match[2]);
        const external = /^https?:\/\//i.test(href);
        nodes.push(
          <a
            key={key}
            href={href}
            className={styles.bodyLink}
            target={external ? '_blank' : undefined}
            rel={external ? 'noreferrer' : undefined}
          >
            {renderInline(value, key)}
          </a>,
        );
        break;
      }
      case 'bold':
        nodes.push(<strong key={key}>{renderInline(value, key)}</strong>);
        break;
      case 'strike':
        nodes.push(<del key={key}>{renderInline(value, key)}</del>);
        break;
      case 'highlight':
        nodes.push(<mark key={key} className={styles.bodyHighlight}>{renderInline(value, key)}</mark>);
        break;
      case 'italic':
        nodes.push(<em key={key}>{renderInline(value, key)}</em>);
        break;
    }

    remaining = remaining.slice(next.match.index + next.match[0].length);
  }

  return nodes;
}

const CALLOUT_ICONS: Record<CalloutKind, typeof Info> = {
  note: NotebookPen,
  tip: Lightbulb,
  warning: AlertTriangle,
  danger: CircleAlert,
  info: Info,
};

export default function WriteupBody({ content }: { content: string }) {
  const blocks = parseWriteupBody(content);

  return (
    <div className={styles.body}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'heading': {
            const Tag = `h${block.level}` as 'h1' | 'h2' | 'h3';
            const className =
              block.level === 1
                ? styles.bodyHeading1
                : block.level === 2
                  ? styles.bodyHeading2
                  : styles.bodyHeading3;
            return <Tag key={i} className={className}>{renderInline(block.text, `heading-${i}`)}</Tag>;
          }
          case 'paragraph':
            return (
              <p key={i} className={styles.bodyParagraph}>
                {block.text.split('\n').map((line, lineIndex) => (
                  <span key={lineIndex}>
                    {lineIndex > 0 && <br />}
                    {renderInline(line, `paragraph-${i}-${lineIndex}`)}
                  </span>
                ))}
              </p>
            );
          case 'code':
            return <CodeBlock key={i} code={block.code} language={block.language} />;
          case 'image':
            return (
              <figure key={i} className={styles.bodyImageWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={block.src} alt={block.alt} className={styles.bodyImage} />
                {block.alt && <figcaption className={styles.bodyImageCaption}>{block.alt}</figcaption>}
              </figure>
            );
          case 'flag':
            return <FlagBlock key={i} value={block.value} />;
          case 'unordered-list':
          case 'ordered-list': {
            const List = block.type === 'ordered-list' ? 'ol' : 'ul';
            return (
              <List key={i} className={styles.bodyList}>
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{renderInline(item, `list-${i}-${itemIndex}`)}</li>
                ))}
              </List>
            );
          }
          case 'task-list':
            return (
              <ul key={i} className={styles.taskList}>
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <input type="checkbox" checked={item.checked} readOnly aria-label={item.text} />
                    <span className={item.checked ? styles.taskDone : undefined}>
                      {renderInline(item.text, `task-${i}-${itemIndex}`)}
                    </span>
                  </li>
                ))}
              </ul>
            );
          case 'blockquote':
            return (
              <blockquote key={i} className={styles.bodyBlockquote}>
                {renderInline(block.text, `quote-${i}`)}
              </blockquote>
            );
          case 'callout': {
            const Icon = CALLOUT_ICONS[block.kind];
            return (
              <aside key={i} className={`${styles.callout} ${styles[`callout_${block.kind}`]}`}>
                <div className={styles.calloutTitle}>
                  <Icon size={17} aria-hidden="true" />
                  {renderInline(block.title, `callout-title-${i}`)}
                </div>
                {block.body && (
                  <div className={styles.calloutBody}>
                    {block.body.split('\n').map((line, lineIndex) => (
                      <span key={lineIndex}>
                        {lineIndex > 0 && <br />}
                        {renderInline(line, `callout-${i}-${lineIndex}`)}
                      </span>
                    ))}
                  </div>
                )}
              </aside>
            );
          }
          case 'table':
            return (
              <div key={i} className={styles.tableWrap}>
                <table className={styles.bodyTable}>
                  <thead>
                    <tr>
                      {block.headers.map((header, cellIndex) => (
                        <th key={cellIndex}>{renderInline(header, `th-${i}-${cellIndex}`)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {block.headers.map((_, cellIndex) => (
                          <td key={cellIndex}>
                            {renderInline(row[cellIndex] ?? '', `td-${i}-${rowIndex}-${cellIndex}`)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case 'details':
            return (
              <details key={i} className={styles.bodyDetails}>
                <summary>{renderInline(block.summary, `details-summary-${i}`)}</summary>
                <div>{renderInline(block.body, `details-body-${i}`)}</div>
              </details>
            );
          case 'horizontal-rule':
            return <hr key={i} className={styles.bodyRule} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
