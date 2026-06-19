'use client';

import Link from 'next/link';
import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import ChipInput from '@/components/site/ChipInput';
import { DIFFICULTIES, formatDateLabel, PLATFORMS, SYSTEMS, type Writeup } from '@/lib/writeups-data';
import { saveOverride } from '@/lib/writeupOverrides';
import { uploadContentFile } from '@/lib/supabase/storage';
import WriteupBody from './WriteupBody';
import styles from './Writeups.module.css';

type ViewMode = 'editar' | 'dividir' | 'previa';

const AUTOSAVE_DELAY_MS = 1200;

function formatSavedLabel(savedAt: number | null, now: number): string {
  if (savedAt === null) return '';
  const diffMs = now - savedAt;
  if (diffMs < 60_000) return 'salvo há instantes';
  const minutes = Math.floor(diffMs / 60_000);
  return minutes === 1 ? 'salvo há 1 min' : `salvo há ${minutes} min`;
}

function CodeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6L3 12l5 6M16 6l5 6-5 6" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22V4M4 4h13l-3 4 3 4H4" />
    </svg>
  );
}

export default function WriteupEditor({
  writeup,
  onExit,
  backHref = '/writeups',
}: {
  writeup: Writeup;
  onExit: (updated: Writeup) => void;
  backHref?: string;
}) {
  const [draft, setDraft] = useState<Writeup>(writeup);
  const [viewMode, setViewMode] = useState<ViewMode>('editar');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const skipNextAutosave = useRef(true);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  const persist = (data: Writeup) => {
    saveOverride(data.slug, data);
    setSavedAt(Date.now());
  };

  useEffect(() => {
    if (skipNextAutosave.current) {
      skipNextAutosave.current = false;
      return;
    }
    const id = setTimeout(() => persist(draft), AUTOSAVE_DELAY_MS);
    return () => clearTimeout(id);
  }, [draft]);

  const update = (patch: Partial<Writeup>) => setDraft((d) => ({ ...d, ...patch }));

  const handleSave = () => persist(draft);

  const handlePublish = () => {
    const next: Writeup = { ...draft, status: 'published' };
    setDraft(next);
    persist(next);
  };

  const insertAtCursor = (snippet: string, cursorOffset: number) => {
    const textarea = textareaRef.current;
    const value = draft.content;
    const start = textarea ? textarea.selectionStart : value.length;
    const end = textarea ? textarea.selectionEnd : value.length;
    const next = value.slice(0, start) + snippet + value.slice(end);
    update({ content: next });
    const pos = start + cursorOffset;
    requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(pos, pos);
    });
  };

  const insertCodeBlock = () => {
    const snippet = '\n```bash\n\n```\n';
    insertAtCursor(snippet, snippet.indexOf('\n\n') + 1);
  };

  const insertFlagBlock = () => {
    const snippet = '\n:::flag\n\n:::\n';
    insertAtCursor(snippet, snippet.indexOf('\n\n') + 1);
  };

  const handleImageSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const url = await uploadContentFile(file, `writeups/${draft.slug}`);
      update({ content: `${draft.content}\n![${file.name}](${url})\n` });
    } catch {
      window.alert('Não foi possível enviar a imagem para o Storage.');
    }
  };

  const savedLabel = formatSavedLabel(savedAt, now);

  return (
    <div className={styles.editor}>
      <div className={styles.editorTopBar}>
        <div className={styles.breadcrumb}>
          <Link href={backHref} className={styles.breadcrumbLink}>writeups</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>{draft.title || 'sem título'}</span>
          <button type="button" onClick={() => onExit(draft)} className={styles.closeEditButton}>
            voltar ao painel
          </button>
        </div>

        <div className={styles.topBarRight}>
          <span className={draft.status === 'published' ? styles.statusBadgePublished : styles.statusBadgeDraft}>
            {draft.status === 'published' ? 'publicado' : 'rascunho'}
          </span>

          <div className={styles.viewToggleGroup}>
            {(['editar', 'dividir', 'previa'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={viewMode === mode ? styles.viewToggleActive : styles.viewToggleInactive}
              >
                {mode === 'previa' ? 'prévia' : mode}
              </button>
            ))}
          </div>

          <span className={styles.autosaveLabel}>{savedLabel}</span>
          <button type="button" onClick={handleSave} className={styles.saveButton}>salvar</button>
          <button type="button" onClick={handlePublish} className={styles.publishButton}>publicar</button>
        </div>
      </div>

      <input
        type="text"
        value={draft.title}
        onChange={(e) => update({ title: e.target.value })}
        placeholder="Título do writeup"
        className={styles.titleField}
      />

      <div className={styles.metadataPanel}>
        <label className={styles.metadataField}>
          <span className={styles.metadataLabel}>plataforma</span>
          <select value={draft.platform} onChange={(e) => update({ platform: e.target.value })} className={styles.metadataSelect}>
            {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label className={styles.metadataField}>
          <span className={styles.metadataLabel}>dificuldade</span>
          <select value={draft.difficulty} onChange={(e) => update({ difficulty: e.target.value })} className={styles.metadataSelect}>
            {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
        <label className={styles.metadataField}>
          <span className={styles.metadataLabel}>os</span>
          <select value={draft.os} onChange={(e) => update({ os: e.target.value })} className={styles.metadataSelect}>
            {SYSTEMS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className={styles.metadataField}>
          <span className={styles.metadataLabel}>data</span>
          <input
            type="date"
            value={draft.date}
            onChange={(e) => update({ date: e.target.value, dateLabel: formatDateLabel(e.target.value) })}
            className={styles.metadataInput}
          />
        </label>
        <div className={styles.metadataField}>
          <span className={styles.metadataLabel}>slug</span>
          <span className={styles.slugDisplay}>{draft.slug}</span>
        </div>
        <div className={styles.metadataFieldWide}>
          <span className={styles.metadataLabel}>tags</span>
          <ChipInput values={draft.tags} onChange={(tags) => update({ tags })} placeholder="adicionar tag…" />
        </div>
        <div className={styles.metadataFieldWide}>
          <span className={styles.metadataLabel}>técnicas mitre att&amp;ck</span>
          <ChipInput
            values={draft.mitre}
            onChange={(mitre) => update({ mitre })}
            placeholder="ex: T1190 - Exploit Public-Facing Application"
            monospace
          />
        </div>
      </div>

      <div className={styles.editorToolbar} hidden={viewMode === 'previa'}>
        <button type="button" onClick={insertCodeBlock} className={styles.toolbarButton}>
          <CodeIcon /> bloco de código
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()} className={styles.toolbarButton}>
          <ImageIcon /> imagem
        </button>
        <button type="button" onClick={insertFlagBlock} className={styles.toolbarButton}>
          <FlagIcon /> flag
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelected} hidden />
      </div>

      <div className={styles.editorContentArea}>
        {viewMode === 'editar' && (
          <textarea
            ref={textareaRef}
            value={draft.content}
            onChange={(e) => update({ content: e.target.value })}
            className={styles.editorTextarea}
            spellCheck={false}
          />
        )}
        {viewMode === 'dividir' && (
          <div className={styles.splitView}>
            <textarea
              ref={textareaRef}
              value={draft.content}
              onChange={(e) => update({ content: e.target.value })}
              className={styles.editorTextareaSplit}
              spellCheck={false}
            />
            <div className={styles.previewPane}>
              <WriteupBody content={draft.content} />
            </div>
          </div>
        )}
        {viewMode === 'previa' && (
          <div className={styles.previewPaneFull}>
            <WriteupBody content={draft.content} />
          </div>
        )}
      </div>
    </div>
  );
}
