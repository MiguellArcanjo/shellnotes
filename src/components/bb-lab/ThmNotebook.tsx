'use client';

import {
  ArrowLeft,
  BookOpen,
  BrainCircuit,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Flame,
  LoaderCircle,
  Lock,
  LogIn,
  Pause,
  Play,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  Square,
  Trash2,
  Wand2,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SiteFooter from '@/components/site/SiteFooter';
import SiteHeader from '@/components/site/SiteHeader';
import { useOwner } from '@/lib/useOwner';
import { LiveEditor, htmlToText, toInitialHtml } from './LiveEditor';
import {
  deleteNote as deleteNoteStore,
  loadNotes,
  loadSessions,
  saveNote as saveNoteStore,
  saveSession as saveSessionStore,
} from '@/lib/thm/store';
import {
  DIFFICULTIES,
  DIFFICULTY_COLOR,
  STATUS_LABEL,
  THM_PATHS,
  createBlankNote,
  dayKey,
  newId,
  todayIso,
  type RoomStatus,
  type StudyNote,
  type StudySession,
} from '@/lib/thm/types';
import styles from './Thm.module.css';

const STATUS_ORDER: RoomStatus[] = ['todo', 'doing', 'done'];
const SETTINGS_KEY = 'shellnotes-thm-pomodoro';

function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function humanMinutes(min: number): string {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h${m}` : `${h}h`;
}

function computeStats(sessions: StudySession[]) {
  const byDay = new Map<string, number>();
  let total = 0;
  for (const session of sessions) {
    total += session.minutes;
    const day = dayKey(session.startedAt);
    byDay.set(day, (byDay.get(day) ?? 0) + session.minutes);
  }
  const today = dayKey(new Date().toISOString());
  const todayMin = byDay.get(today) ?? 0;
  let streak = 0;
  const cursor = new Date();
  if (!byDay.get(today)) cursor.setDate(cursor.getDate() - 1);
  while (byDay.get(dayKey(cursor.toISOString()))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { todayMin, total, streak };
}

function readSettings(): { focusMin: number; breakMin: number } {
  const fallback = { focusMin: 25, breakMin: 5 };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<typeof fallback>;
    return { focusMin: parsed.focusMin || 25, breakMin: parsed.breakMin || 5 };
  } catch {
    return fallback;
  }
}

function beep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    /* audio blocked */
  }
}

// ===========================================================================

export default function ThmNotebook() {
  const { isOwner, isReady } = useOwner();
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <SiteHeader active="bb-lab" />
        {!isReady ? <div className={styles.empty}>verificando sessão…</div> : !isOwner ? <AuthGate /> : <Notebook />}
        <SiteFooter />
      </div>
    </div>
  );
}

function AuthGate() {
  return (
    <div className={styles.gate}>
      <Lock size={26} />
      <h1>Caderno de estudos</h1>
      <p>Suas notas e sessões ficam salvas no banco e são privadas. Faça login como dono pra acessar.</p>
      <Link href="/login?next=/bb-lab" className={styles.gateBtn}><LogIn size={15} /> entrar</Link>
    </div>
  );
}

// ===========================================================================

function Notebook() {
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [dbWarn, setDbWarn] = useState(false);
  const [loading, setLoading] = useState(true);

  // pomodoro
  const [focusMin, setFocusMin] = useState(() => readSettings().focusMin);
  const [breakMin, setBreakMin] = useState(() => readSettings().breakMin);
  const [phase, setPhase] = useState<'idle' | 'focus' | 'break'>('idle');
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const focusedSec = useRef(0);
  const sessionStart = useRef('');

  const selected = notes.find((note) => note.slug === selectedSlug) ?? null;
  const stats = useMemo(() => computeStats(sessions), [sessions]);

  useEffect(() => {
    let active = true;
    void Promise.all([loadNotes(), loadSessions()]).then(([n, s]) => {
      if (!active) return;
      setNotes(n);
      setSessions(s);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ focusMin, breakMin }));
    } catch {
      /* ignore */
    }
  }, [focusMin, breakMin]);

  const persistNote = useCallback((note: StudyNote) => {
    setNotes((prev) => {
      const map = new Map(prev.map((item) => [item.slug, item]));
      map.set(note.slug, note);
      return [...map.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    });
    void saveNoteStore(note).then((ok) => { if (!ok) setDbWarn(true); });
  }, []);

  const removeNote = useCallback((slug: string) => {
    setNotes((prev) => prev.filter((item) => item.slug !== slug));
    setSelectedSlug(null);
    void deleteNoteStore(slug);
  }, []);

  const logSession = useCallback((noteSlug: string, label: string) => {
    const seconds = focusedSec.current;
    focusedSec.current = 0;
    if (seconds < 30) return;
    const session: StudySession = {
      id: newId(),
      startedAt: sessionStart.current || todayIso(),
      endedAt: todayIso(),
      minutes: Math.max(1, Math.round(seconds / 60)),
      focusBreaks: 0,
      label,
      noteSlug,
    };
    setSessions((prev) => [session, ...prev]);
    void saveSessionStore(session).then((ok) => { if (!ok) setDbWarn(true); });
  }, []);

  useEffect(() => {
    if (!running || phase === 'idle') return;
    const id = setInterval(() => {
      if (phase === 'focus') focusedSec.current += 1;
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => clearInterval(id);
  }, [running, phase]);

  useEffect(() => {
    if (phase === 'idle' || !running || secondsLeft > 0) return;
    /* eslint-disable react-hooks/set-state-in-effect -- pomodoro timer state machine */
    if (phase === 'focus') {
      beep();
      logSession(selectedSlug ?? '', selected?.title || 'estudo');
      setPhase('break');
      setSecondsLeft(breakMin * 60);
    } else {
      beep();
      setPhase('idle');
      setRunning(false);
      setSecondsLeft(0);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, phase, running]);

  const startFocus = () => {
    setPhase('focus');
    setSecondsLeft(focusMin * 60);
    setRunning(true);
    focusedSec.current = 0;
    sessionStart.current = todayIso();
  };
  const togglePause = () => setRunning((value) => !value);
  const stopTimer = () => {
    if (phase === 'focus') logSession(selectedSlug ?? '', selected?.title || 'estudo');
    setPhase('idle');
    setRunning(false);
    setSecondsLeft(0);
  };

  return (
    <>
      <PomodoroBar
        phase={phase}
        running={running}
        secondsLeft={secondsLeft}
        focusMin={focusMin}
        breakMin={breakMin}
        todayMin={stats.todayMin}
        streak={stats.streak}
        onStart={startFocus}
        onToggle={togglePause}
        onStop={stopTimer}
        onFocusMin={setFocusMin}
        onBreakMin={setBreakMin}
      />

      {dbWarn && (
        <div className={styles.dbWarn}>
          <ShieldAlert size={15} />
          <span>Não consegui salvar no banco agora. Seus dados estão guardados localmente; confira o login. Se persistir, rode a migração <code>202606210001_study_notebook.sql</code> no Supabase.</span>
        </div>
      )}

      {loading ? (
        <div className={styles.empty}>carregando suas notas…</div>
      ) : selected ? (
        <NoteWorkspace
          key={selected.slug}
          initial={selected}
          studying={phase === 'focus'}
          onSaved={persistNote}
          onDelete={() => removeNote(selected.slug)}
          onBack={() => setSelectedSlug(null)}
        />
      ) : (
        <Dashboard
          notes={notes}
          stats={stats}
          onOpen={setSelectedSlug}
          onNew={() => { const note = createBlankNote(); persistNote(note); setSelectedSlug(note.slug); }}
        />
      )}
    </>
  );
}

// ===========================================================================

function PomodoroBar({
  phase, running, secondsLeft, focusMin, breakMin, todayMin, streak,
  onStart, onToggle, onStop, onFocusMin, onBreakMin,
}: {
  phase: 'idle' | 'focus' | 'break';
  running: boolean;
  secondsLeft: number;
  focusMin: number;
  breakMin: number;
  todayMin: number;
  streak: number;
  onStart: () => void;
  onToggle: () => void;
  onStop: () => void;
  onFocusMin: (value: number) => void;
  onBreakMin: (value: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const idle = phase === 'idle';
  return (
    <div className={`${styles.pomodoro} ${phase === 'focus' ? styles.pomoFocus : phase === 'break' ? styles.pomoBreak : ''}`}>
      <div className={styles.pomoClock}>
        <Clock size={16} />
        <strong>{idle ? formatClock(focusMin * 60) : formatClock(secondsLeft)}</strong>
        <span>{idle ? 'pronto' : phase === 'focus' ? 'foco' : 'pausa'}</span>
      </div>
      <div className={styles.pomoControls}>
        {idle ? (
          <button type="button" className={styles.pomoStart} onClick={onStart}><Play size={14} /> iniciar foco</button>
        ) : (
          <>
            <button type="button" className={styles.pomoBtn} onClick={onToggle}>{running ? <><Pause size={14} /> pausar</> : <><Play size={14} /> retomar</>}</button>
            <button type="button" className={styles.pomoBtn} onClick={onStop}><Square size={13} /> encerrar</button>
          </>
        )}
      </div>
      <div className={styles.pomoStats}>
        <span><Clock size={12} /> hoje {humanMinutes(todayMin)}</span>
        <span><Flame size={12} /> {streak}d</span>
        <button type="button" className={styles.pomoGear} onClick={() => setOpen((value) => !value)}>{open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>
      </div>
      {open && (
        <div className={styles.pomoSettings}>
          <label>foco (min)<input type="number" min={1} max={120} value={focusMin} onChange={(event) => onFocusMin(Math.max(1, Number(event.target.value) || 25))} /></label>
          <label>pausa (min)<input type="number" min={1} max={60} value={breakMin} onChange={(event) => onBreakMin(Math.max(1, Number(event.target.value) || 5))} /></label>
        </div>
      )}
    </div>
  );
}

// ===========================================================================

function Dashboard({
  notes, stats, onOpen, onNew,
}: {
  notes: StudyNote[];
  stats: { todayMin: number; total: number; streak: number };
  onOpen: (slug: string) => void;
  onNew: () => void;
}) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<RoomStatus | 'all'>('all');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return notes.filter((note) => {
      const matchesQuery = !needle || [note.title, note.path, note.module, ...note.tags, ...note.concepts].join(' ').toLowerCase().includes(needle);
      const matchesStatus = statusFilter === 'all' || note.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [notes, query, statusFilter]);

  return (
    <>
      <section className={styles.hero}>
        <div>
          <div className={styles.eyebrow}>caderno de estudos · tryhackme</div>
          <h1 className={styles.title}>Estudos</h1>
          <p className={styles.subtitle}>
            Suas anotações dos learning paths e o relógio de foco que conta seu tempo de estudo. Tudo salvo no banco.
          </p>
        </div>
        <button type="button" className={styles.newBtn} onClick={onNew}><Plus size={15} /> nova nota</button>
      </section>

      <section className={styles.metrics}>
        <article><Clock size={16} /><span>hoje</span><strong>{humanMinutes(stats.todayMin)}</strong></article>
        <article><Flame size={16} /><span>sequência</span><strong>{stats.streak}d</strong></article>
        <article><Clock size={16} /><span>total estudado</span><strong>{humanMinutes(stats.total)}</strong></article>
        <article><BookOpen size={16} /><span>notas</span><strong>{notes.length}</strong></article>
      </section>

      <section className={styles.filters}>
        <div className={styles.searchBox}>
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="buscar nota, trilha, conceito…" />
        </div>
        <div className={styles.segmented}>
          <button type="button" className={statusFilter === 'all' ? styles.segOn : styles.seg} onClick={() => setStatusFilter('all')}>todas</button>
          {STATUS_ORDER.map((status) => (
            <button key={status} type="button" className={statusFilter === status ? styles.segOn : styles.seg} onClick={() => setStatusFilter(status)}>{STATUS_LABEL[status]}</button>
          ))}
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          {notes.length === 0 ? 'Nenhuma nota ainda. Crie a primeira pra começar a documentar o que está estudando.' : 'Nenhuma nota combina com o filtro.'}
        </div>
      ) : (
        <section className={styles.roomGrid}>
          {filtered.map((note) => <NoteCard key={note.slug} note={note} onOpen={() => onOpen(note.slug)} />)}
        </section>
      )}
    </>
  );
}

function NoteCard({ note, onOpen }: { note: StudyNote; onOpen: () => void }) {
  return (
    <button type="button" className={styles.roomCard} onClick={onOpen}>
      <div className={styles.roomCardTop}>
        <span className={`${styles.diff} ${styles[`diff_${DIFFICULTY_COLOR[note.difficulty]}`]}`}>{note.difficulty}</span>
        <span className={`${styles.statusDot} ${styles[`st_${note.status}`]}`}>{STATUS_LABEL[note.status]}</span>
      </div>
      <strong className={styles.roomName}>{note.title || '(sem título)'}</strong>
      <span className={styles.roomPath}><BookOpen size={12} /> {note.path}{note.module ? ` · ${note.module}` : ''}</span>
      {note.concepts.length > 0 && <div className={styles.roomTags}>{note.concepts.slice(0, 4).map((concept) => <span key={concept}>{concept}</span>)}</div>}
    </button>
  );
}

// ===========================================================================

function NoteWorkspace({
  initial, studying, onSaved, onDelete, onBack,
}: {
  initial: StudyNote;
  studying: boolean;
  onSaved: (note: StudyNote) => void;
  onDelete: () => void;
  onBack: () => void;
}) {
  const [note, setNote] = useState<StudyNote>(initial);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      onSaved(note);
      setSavedAt(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }, 700);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [note, onSaved]);

  const patch = useCallback((partial: Partial<StudyNote>) => {
    setNote((current) => ({ ...current, ...partial, updatedAt: todayIso() }));
  }, []);

  return (
    <div className={styles.workspace}>
      <div className={styles.wsBar}>
        <button type="button" className={styles.back} onClick={onBack}><ArrowLeft size={14} /> estudos</button>
        <div className={styles.wsBarRight}>
          {studying && <span className={styles.studyingTag}><Clock size={12} /> em foco</span>}
          {savedAt && <span className={styles.savedNote}><Check size={12} /> salvo {savedAt}</span>}
          <button type="button" className={styles.deleteBtn} onClick={() => { if (window.confirm('Apagar esta nota?')) onDelete(); }}><Trash2 size={13} /> apagar</button>
        </div>
      </div>

      <section className={styles.headEditor}>
        <input className={styles.nameInput} value={note.title} onChange={(event) => patch({ title: event.target.value })} placeholder="título da nota (ex.: Network Services)" />
        <div className={styles.headRow}>
          <select className={styles.select} value={note.status} onChange={(event) => patch({ status: event.target.value as RoomStatus })}>
            {STATUS_ORDER.map((status) => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}
          </select>
          <select className={styles.select} value={note.difficulty} onChange={(event) => patch({ difficulty: event.target.value as StudyNote['difficulty'] })}>
            {DIFFICULTIES.map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty}</option>)}
          </select>
          <select className={styles.select} value={note.path} onChange={(event) => patch({ path: event.target.value })}>
            {THM_PATHS.map((path) => <option key={path} value={path}>{path}</option>)}
          </select>
          <input className={styles.flexInput} value={note.module} onChange={(event) => patch({ module: event.target.value })} placeholder="módulo (opcional)" />
          <input className={styles.flexInput} value={note.url} onChange={(event) => patch({ url: event.target.value })} placeholder="link da room" />
          {note.url && <a className={styles.openLink} href={note.url} target="_blank" rel="noreferrer"><ExternalLink size={14} /></a>}
        </div>
        <ChipInput label="tags" values={note.tags} onChange={(tags) => patch({ tags })} placeholder="enumeration, smb…" />
      </section>

      <LiveEditor
        initialHtml={toInitialHtml(note.notes)}
        onChange={(html) => patch({ notes: html })}
        placeholder="Escreva suas anotações. Digite # para título, - para lista, ou use a barra acima…"
      />

      <section className={styles.conceptsBar}>
        <div className={styles.blockHead}><h3><BrainCircuit size={15} /> conceitos aprendidos</h3><span className={styles.calNote}><Calendar size={12} /> criada em {dayKey(note.createdAt).split('-').reverse().join('/')}</span></div>
        <ChipInput values={note.concepts} onChange={(concepts) => patch({ concepts })} placeholder="o que essa room te ensinou? adicione e Enter" />
      </section>

      <AiSection note={note} />
    </div>
  );
}

// ===========================================================================

function buildPrompt(note: StudyNote): string {
  return [
    `Você é um mentor escrevendo um RESUMO de estudo em português (markdown) sobre uma room de aprendizado do TryHackMe, para um INICIANTE revisar depois.`,
    `Room: "${note.title}" (trilha ${note.path}${note.module ? `, módulo ${note.module}` : ''}, dificuldade ${note.difficulty}).`,
    `Conceitos marcados: ${note.concepts.join(', ') || 'nenhum'}.`,
    note.notes ? `Anotações do aluno:\n${htmlToText(note.notes)}` : '',
    `Produza: ## Resumo, ## Conceitos-chave (bullets), ## Comandos/ferramentas importantes, ## Para revisar depois. Conciso, claro e fiel às anotações — não invente o que não está lá.`,
  ].filter(Boolean).join('\n\n');
}

function AiSection({ note }: { note: StudyNote }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [setupRequired, setSetupRequired] = useState(false);

  const run = async () => {
    setLoading(true);
    setResult('');
    setError('');
    setSetupRequired(false);
    try {
      const response = await fetch('/api/thm/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: buildPrompt(note) }),
      });
      const payload = (await response.json()) as { answer?: string; error?: string; setupRequired?: boolean };
      if (!response.ok) {
        setSetupRequired(Boolean(payload.setupRequired));
        throw new Error(payload.error || 'O assistente não respondeu.');
      }
      setResult((payload.answer || '').trim());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao consultar o assistente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.block}>
      <div className={styles.blockHead}><h3><Wand2 size={15} /> assistente (claude no droplet)</h3></div>
      <button type="button" className={styles.aiBtn} onClick={run} disabled={loading}>
        {loading ? <LoaderCircle size={14} className={styles.spin} /> : <Sparkles size={14} />}
        gerar resumo de estudo
      </button>
      {error && (
        <div className={styles.aiError}>
          <strong>{setupRequired ? 'Assistente ainda não conectado.' : 'Não consegui responder.'}</strong>
          <span>{error}</span>
          {setupRequired && <code>SHELLNOTES_MENTOR_URL + SHELLNOTES_MENTOR_SECRET</code>}
        </div>
      )}
      {result && <div className={styles.mdRender} dangerouslySetInnerHTML={{ __html: toInitialHtml(result) }} />}
    </section>
  );
}

// ===========================================================================

function ChipInput({
  label, values, onChange, placeholder,
}: {
  label?: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const value = draft.trim();
    if (!value || values.includes(value)) { setDraft(''); return; }
    onChange([...values, value]);
    setDraft('');
  };
  return (
    <div className={styles.chipStack}>
      {label && <span className={styles.chipLabel}>{label}</span>}
      <div className={styles.chips}>
        {values.map((value) => (
          <span key={value} className={styles.chip}>{value}<button type="button" onClick={() => onChange(values.filter((item) => item !== value))}><Plus size={11} style={{ transform: 'rotate(45deg)' }} /></button></span>
        ))}
        <input className={styles.chipField} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); add(); } }} onBlur={add} placeholder={placeholder} />
      </div>
    </div>
  );
}
