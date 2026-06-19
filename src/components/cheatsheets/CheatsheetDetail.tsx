import Link from 'next/link';
import SiteFooter from '@/components/site/SiteFooter';
import SiteHeader from '@/components/site/SiteHeader';
import type { Cheatsheet } from '@/lib/cheatsheets-data';
import CodeBlock from './CodeBlock';
import styles from './Cheatsheets.module.css';

function BackArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export default function CheatsheetDetail({
  sheet,
  isOwner,
  onEdit,
}: {
  sheet: Cheatsheet;
  isOwner?: boolean;
  onEdit?: () => void;
}) {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <SiteHeader active="cheatsheets" />

        <section className={styles.detailHeader}>
          <div className={styles.detailHeaderTop}>
            <Link href="/cheatsheets" className={styles.backLink}>
              <BackArrowIcon />
              todas as cheatsheets
            </Link>
            {isOwner && onEdit && (
              <button type="button" onClick={onEdit} className={styles.editButton}>
                editar
              </button>
            )}
          </div>
          <div className={styles.detailKicker}>{sheet.kicker}</div>
          <h1 className={styles.detailTitle}>{sheet.title}</h1>
          <p className={styles.detailDesc}>{sheet.desc}</p>
        </section>

        <section className={styles.groupsSection}>
          {sheet.groups.map((group) => (
            <div key={group.subtitle} className={styles.group}>
              <div className={styles.groupSubtitle}>{group.subtitle}</div>
              <div className={styles.itemsList}>
                {group.items.map((item) => (
                  <CodeBlock key={item.code} note={item.note} code={item.code} />
                ))}
              </div>
            </div>
          ))}
        </section>

        <SiteFooter />
      </div>
    </div>
  );
}
