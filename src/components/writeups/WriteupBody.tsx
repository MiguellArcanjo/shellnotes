import { parseWriteupBody } from '@/lib/writeupBlocks';
import CodeBlock from './CodeBlock';
import FlagBlock from './FlagBlock';
import styles from './Writeups.module.css';

export default function WriteupBody({ content }: { content: string }) {
  const blocks = parseWriteupBody(content);

  return (
    <div className={styles.body}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'heading': {
            const Tag = block.level === 2 ? 'h2' : 'h3';
            const className = block.level === 2 ? styles.bodyHeading2 : styles.bodyHeading3;
            return <Tag key={i} className={className}>{block.text}</Tag>;
          }
          case 'paragraph':
            return <p key={i} className={styles.bodyParagraph}>{block.text}</p>;
          case 'code':
            return <CodeBlock key={i} code={block.code} language={block.language} />;
          case 'image':
            return (
              <div key={i} className={styles.bodyImageWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={block.src} alt={block.alt} className={styles.bodyImage} />
                {block.alt && <div className={styles.bodyImageCaption}>{block.alt}</div>}
              </div>
            );
          case 'flag':
            return <FlagBlock key={i} value={block.value} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
