'use client';

import {
  ArrowLeft,
  ArrowUpRight,
  Award,
  BookOpen,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronRight,
  Code2,
  Database,
  Flame,
  FlaskConical,
  Globe,
  KeyRound,
  Lightbulb,
  LoaderCircle,
  Lock,
  Play,
  RotateCcw,
  Server,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CURRICULUM,
  countLabs,
  countLessons,
  countQuizzes,
  type ChallengeLab,
  type Lab,
  type Module,
  type SqlLab,
  type XssLab,
} from '@/lib/academy/curriculum';
import { mentorExplain, mentorGrade, mentorHint, type Verdict } from '@/lib/academy/mentor';
import {
  EMPTY_PROGRESS,
  type Progress,
  completeLab,
  completeLesson,
  completeQuiz,
  isModuleComplete,
  isModuleUnlocked,
  levelFromXp,
  load,
  moduleProgress,
  rankFor,
  registerAttempt,
  registerHint,
  save,
  touchStreak,
} from '@/lib/academy/progress';
import { runVulnerableQuery, seedDatabase } from '@/lib/academy/sqlEngine';
import type { BBLabReport } from '@/types/bb-lab';
import styles from './BBLab.module.css';

const MODULE_ICONS: Record<string, typeof Globe> = {
  Globe,
  KeyRound,
  Database,
  Code2,
  Server,
};

const DIFFICULTY_RANK: Record<string, number> = {
  iniciante: 1,
  fácil: 2,
  médio: 3,
  avançado: 4,
};

function relevantReports(reports: BBLabReport[], technique: string | null): BBLabReport[] {
  if (!technique) return reports.slice(0, 12);
  const target = technique.toLowerCase();
  const matched = reports.filter((report) => {
    const value = report.technique.toLowerCase();
    return value.includes(target) || target.includes(value);
  });
  return (matched.length ? matched : reports).slice(0, 12);
}

// ===========================================================================
// Main component
// ===========================================================================

export default function StudyHub({
  reports,
  loadingReports,
}: {
  reports: BBLabReport[];
  loadingReports: boolean;
}) {
  const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS);
  const [openModuleId, setOpenModuleId] = useState<string | null>(null);

  useEffect(() => {
    const loaded = touchStreak(load());
    save(loaded);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress(loaded);
  }, []);

  const update = useCallback((producer: (current: Progress) => Progress) => {
    setProgress((current) => {
      const next = producer(current);
      save(next);
      return next;
    });
  }, []);

  const level = levelFromXp(progress.xp);
  const rank = rankFor(level.level);

  const openModule = openModuleId ? CURRICULUM.find((module) => module.id === openModuleId) : null;

  return (
    <section className={styles.academy}>
      <AcademyHeader progress={progress} level={level} rank={rank} />

      {openModule ? (
        <ModuleView
          module={openModule}
          progress={progress}
          reports={reports}
          loadingReports={loadingReports}
          update={update}
          onBack={() => setOpenModuleId(null)}
        />
      ) : (
        <PathView progress={progress} onOpen={setOpenModuleId} update={update} />
      )}
    </section>
  );
}

// ===========================================================================
// Header — rank, level, XP, streak
// ===========================================================================

function AcademyHeader({
  progress,
  level,
  rank,
}: {
  progress: Progress;
  level: ReturnType<typeof levelFromXp>;
  rank: string;
}) {
  const pct = Math.round((level.into / level.needed) * 100);
  return (
    <div className={styles.acHeader}>
      <div className={styles.acIdentity}>
        <div className={styles.acLevelBadge}>
          <span>nível</span>
          <strong>{level.level}</strong>
        </div>
        <div className={styles.acIdentityText}>
          <div className={styles.eyebrow}>academia ofensiva · prática deliberada</div>
          <h2>{rank}</h2>
          <div className={styles.acXpBar} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${pct}%` }} />
          </div>
          <small>{level.into} / {level.needed} XP para o próximo nível · {progress.xp} XP no total</small>
        </div>
      </div>
      <div className={styles.acStats}>
        <div><Flame size={15} /><strong>{progress.streakDays}</strong><span>dias seguidos</span></div>
        <div><Trophy size={15} /><strong>{progress.completedLabs.length}/{countLabs()}</strong><span>labs</span></div>
        <div><BookOpen size={15} /><strong>{progress.completedLessons.length}/{countLessons()}</strong><span>lições</span></div>
        <div><Target size={15} /><strong>{progress.completedQuiz.length}/{countQuizzes()}</strong><span>quizzes</span></div>
      </div>
    </div>
  );
}

// ===========================================================================
// Path view — module map / skill tree
// ===========================================================================

function PathView({
  progress,
  onOpen,
  update,
}: {
  progress: Progress;
  onOpen: (id: string) => void;
  update: (producer: (current: Progress) => Progress) => void;
}) {
  const resetProgress = () => {
    if (typeof window !== 'undefined' && !window.confirm('Zerar todo o progresso da academia?')) return;
    update(() => touchStreak(EMPTY_PROGRESS));
  };

  return (
    <div className={styles.acPath}>
      <div className={styles.acPathIntro}>
        <div>
          <h3>Sua trilha</h3>
          <p>Comece pelos fundamentos. Cada módulo libera o próximo quando você conclui lições, labs e quiz.</p>
        </div>
        {progress.history.length > 0 && (
          <button type="button" className={styles.acResetBtn} onClick={resetProgress}>
            <RotateCcw size={13} /> zerar progresso
          </button>
        )}
      </div>

      <div className={styles.acModuleGrid}>
        {CURRICULUM.map((module, index) => {
          const Icon = MODULE_ICONS[module.icon] ?? Globe;
          const unlocked = isModuleUnlocked(progress, module.requires, CURRICULUM);
          const complete = isModuleComplete(progress, module);
          const { done, total } = moduleProgress(progress, module);
          const pct = total ? Math.round((done / total) * 100) : 0;
          const blockedBy = module.requires
            .map((id) => CURRICULUM.find((candidate) => candidate.id === id)?.title)
            .filter(Boolean)
            .join(', ');

          return (
            <button
              key={module.id}
              type="button"
              disabled={!unlocked}
              onClick={() => unlocked && onOpen(module.id)}
              className={`${styles.acModuleCard} ${complete ? styles.acModuleDone : ''} ${!unlocked ? styles.acModuleLocked : ''}`}
            >
              <div className={styles.acModuleTop}>
                <span className={styles.acModuleIcon}>
                  {unlocked ? <Icon size={20} /> : <Lock size={18} />}
                </span>
                <span className={styles.acModuleStep}>etapa {String(index + 1).padStart(2, '0')}</span>
                {complete && <span className={styles.acDoneTag}><CheckCircle2 size={13} /> dominado</span>}
              </div>
              <h4>{module.title}</h4>
              <p>{module.tagline}</p>
              <div className={styles.acModuleMeta}>
                <span className={styles[`diff_${DIFFICULTY_RANK[module.difficulty]}`]}>{module.difficulty}</span>
                <span>{module.lessons.length} lições · {module.labs.length} labs</span>
              </div>
              {unlocked ? (
                <div className={styles.acModuleBar}><span style={{ width: `${pct}%` }} /></div>
              ) : (
                <div className={styles.acLockNote}><Lock size={11} /> conclua: {blockedBy}</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ===========================================================================
// Module view — lessons, labs, quiz, real-world reports
// ===========================================================================

type ModuleTab = 'licoes' | 'labs' | 'quiz' | 'real';

function ModuleView({
  module,
  progress,
  reports,
  loadingReports,
  update,
  onBack,
}: {
  module: Module;
  progress: Progress;
  reports: BBLabReport[];
  loadingReports: boolean;
  update: (producer: (current: Progress) => Progress) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<ModuleTab>(module.lessons.length ? 'licoes' : 'labs');
  const moduleReports = useMemo(() => relevantReports(reports, module.technique), [reports, module.technique]);

  const tabs: Array<[ModuleTab, string, number]> = [
    ['licoes', 'lições', module.lessons.length],
    ['labs', 'labs', module.labs.length],
    ['quiz', 'quiz', module.quiz.length],
    ['real', 'mundo real', moduleReports.length],
  ];

  return (
    <div className={styles.acModuleView}>
      <button type="button" className={styles.acBack} onClick={onBack}>
        <ArrowLeft size={14} /> voltar à trilha
      </button>

      <header className={styles.acModuleHead}>
        <div>
          <div className={styles.eyebrow}>{module.difficulty} · {module.lessons.length + module.labs.length + module.quiz.length} atividades</div>
          <h3>{module.title}</h3>
          <p>{module.tagline}</p>
        </div>
        {isModuleComplete(progress, module) && (
          <div className={styles.acModuleSeal}><Award size={16} /> módulo dominado</div>
        )}
      </header>

      <div className={styles.acTabs} role="tablist">
        {tabs.filter(([, , count]) => count > 0).map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? styles.acTabActive : styles.acTab}
            onClick={() => setTab(key)}
          >
            {label} <span>{count}</span>
          </button>
        ))}
      </div>

      {tab === 'licoes' && (
        <div className={styles.acLessons}>
          {module.lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              done={progress.completedLessons.includes(lesson.id)}
              onComplete={() => update((current) => completeLesson(current, lesson.id, lesson.title))}
            />
          ))}
        </div>
      )}

      {tab === 'labs' && (
        <div className={styles.acLabs}>
          {module.labs.map((lab) => (
            <LabRunner
              key={lab.id}
              lab={lab}
              module={module}
              reports={moduleReports}
              solved={progress.completedLabs.includes(lab.id)}
              onSolved={() => update((current) => completeLab(current, lab.id, lab.title))}
              onAttempt={() => update((current) => registerAttempt(current))}
              onHint={() => update((current) => registerHint(current))}
            />
          ))}
        </div>
      )}

      {tab === 'quiz' && (
        <QuizSection
          module={module}
          progress={progress}
          onAnswered={(id, correct) => update((current) => completeQuiz(current, id, correct))}
        />
      )}

      {tab === 'real' && (
        <RealWorldSection reports={moduleReports} loading={loadingReports} technique={module.technique} />
      )}
    </div>
  );
}

// ===========================================================================
// Lesson card
// ===========================================================================

function LessonCard({
  lesson,
  done,
  onComplete,
}: {
  lesson: { id: string; title: string; minutes: number; body: string[]; keyPoints: string[] };
  done: boolean;
  onComplete: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <article className={`${styles.acLesson} ${done ? styles.acLessonDone : ''}`}>
      <button type="button" className={styles.acLessonHead} onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span className={styles.acLessonIcon}>{done ? <CheckCircle2 size={16} /> : <BookOpen size={16} />}</span>
        <span>
          <strong>{lesson.title}</strong>
          <small>{lesson.minutes} min de leitura</small>
        </span>
        <ChevronRight size={16} className={open ? styles.acRot : ''} />
      </button>
      {open && (
        <div className={styles.acLessonBody}>
          {lesson.body.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          <div className={styles.acKeyPoints}>
            <strong><Zap size={13} /> pontos-chave</strong>
            <ul>{lesson.keyPoints.map((point) => <li key={point}>{point}</li>)}</ul>
          </div>
          {!done && (
            <button type="button" className={styles.acPrimaryBtn} onClick={onComplete}>
              <Check size={14} /> marcar como lida (+20 XP)
            </button>
          )}
        </div>
      )}
    </article>
  );
}

// ===========================================================================
// Lab runner — handles sql / xss / challenge
// ===========================================================================

function LabRunner({
  lab,
  module,
  reports,
  solved,
  onSolved,
  onAttempt,
  onHint,
}: {
  lab: Lab;
  module: Module;
  reports: BBLabReport[];
  solved: boolean;
  onSolved: () => void;
  onAttempt: () => void;
  onHint: () => void;
}) {
  const technique = module.technique ?? module.title;

  if (lab.kind === 'sql') {
    return (
      <SqlLabRunner lab={lab} technique={technique} reports={reports} solved={solved} onSolved={onSolved} onAttempt={onAttempt} onHint={onHint} />
    );
  }
  if (lab.kind === 'xss') {
    return (
      <XssLabRunner lab={lab} technique={technique} reports={reports} solved={solved} onSolved={onSolved} onAttempt={onAttempt} onHint={onHint} />
    );
  }
  return (
    <ChallengeLabRunner lab={lab} technique={technique} reports={reports} solved={solved} onSolved={onSolved} onAttempt={onAttempt} onHint={onHint} />
  );
}

type RunnerShared = {
  technique: string;
  reports: BBLabReport[];
  solved: boolean;
  onSolved: () => void;
  onAttempt: () => void;
  onHint: () => void;
};

function LabShell({
  lab,
  solved,
  difficultyLabel,
  children,
}: {
  lab: { title: string; scenario: string; goal: string };
  solved: boolean;
  difficultyLabel: string;
  children: ReactNode;
}) {
  return (
    <article className={`${styles.acLab} ${solved ? styles.acLabSolved : ''}`}>
      <header className={styles.acLabHead}>
        <div>
          <span className={styles.acLabTag}><FlaskConical size={12} /> {difficultyLabel}{solved ? ' · resolvido' : ''}</span>
          <h4>{lab.title}</h4>
          <p>{lab.scenario}</p>
        </div>
        {solved && <span className={styles.acSolvedSeal}><CheckCircle2 size={18} /></span>}
      </header>
      <div className={styles.acLabObjective}><Target size={14} /> <span>{lab.goal}</span></div>
      {children}
    </article>
  );
}

function MentorBox({
  technique,
  labTitle,
  scenario,
  goal,
  attempt,
  reports,
  onHint,
}: {
  technique: string;
  labTitle: string;
  scenario: string;
  goal: string;
  attempt: string;
  reports: BBLabReport[];
  onHint: () => void;
}) {
  const [reply, setReply] = useState('');
  const [setupRequired, setSetupRequired] = useState(false);
  const [loading, setLoading] = useState(false);

  const askHint = async () => {
    setLoading(true);
    setReply('');
    setSetupRequired(false);
    onHint();
    const result = await mentorHint(
      { moduleTitle: technique, technique, labTitle, scenario, goal, attempt },
      reports,
    );
    setReply(result.text);
    setSetupRequired(Boolean(result.setupRequired));
    setLoading(false);
  };

  return (
    <div className={styles.acMentor}>
      <button type="button" className={styles.acHintBtn} onClick={askHint} disabled={loading}>
        {loading ? <LoaderCircle size={13} className={styles.spin} /> : <Lightbulb size={13} />}
        {loading ? 'pensando…' : 'pedir dica ao mentor'}
      </button>
      {reply && (
        <div className={styles.acMentorReply}>
          <strong><BrainCircuit size={13} /> mentor BB</strong>
          {reply.split('\n').filter(Boolean).map((line, index) => <p key={index}>{line}</p>)}
          {setupRequired && <code>configure SHELLNOTES_MENTOR_URL + SHELLNOTES_MENTOR_SECRET no droplet</code>}
        </div>
      )}
    </div>
  );
}

function SolvedDebrief({
  debrief,
  solution,
  technique,
  labTitle,
  goal,
  reports,
}: {
  debrief: string;
  solution: string;
  technique: string;
  labTitle: string;
  goal: string;
  reports: BBLabReport[];
}) {
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);

  const explain = async () => {
    setLoading(true);
    const result = await mentorExplain({ moduleTitle: technique, technique, labTitle, scenario: '', goal }, reports);
    setExplanation(result.text);
    setLoading(false);
  };

  return (
    <div className={styles.acDebrief}>
      <div className={styles.acDebriefHead}><CheckCircle2 size={15} /> <strong>Resolvido!</strong></div>
      <p>{debrief}</p>
      <details className={styles.acSolution}>
        <summary>ver solução de referência</summary>
        <pre><code>{solution}</code></pre>
      </details>
      <button type="button" className={styles.acGhostBtn} onClick={explain} disabled={loading}>
        {loading ? <LoaderCircle size={13} className={styles.spin} /> : <BrainCircuit size={13} />}
        {loading ? 'consultando…' : 'mentor: por que isso importa no mundo real?'}
      </button>
      {explanation && (
        <div className={styles.acMentorReply}>
          {explanation.split('\n').filter(Boolean).map((line, index) => <p key={index}>{line}</p>)}
        </div>
      )}
    </div>
  );
}

// --- SQL ---------------------------------------------------------------------

function SqlLabRunner({ lab, technique, reports, solved, onSolved, onAttempt, onHint }: { lab: SqlLab } & RunnerShared) {
  const [input, setInput] = useState(lab.starter);
  const [result, setResult] = useState<ReturnType<typeof runVulnerableQuery> | null>(null);
  const [justSolved, setJustSolved] = useState(false);

  const run = () => {
    const next = runVulnerableQuery(seedDatabase(), lab.template, input);
    setResult(next);
    onAttempt();
    if (lab.success(next)) {
      setJustSolved(true);
      onSolved();
    } else {
      setJustSolved(false);
    }
  };

  const success = solved || justSolved;

  return (
    <LabShell lab={lab} solved={solved} difficultyLabel={lab.difficulty}>
      <div className={styles.acQueryTemplate}>
        <span>consulta vulnerável no servidor</span>
        <code>{lab.templateLabel}</code>
      </div>
      <div className={styles.acSqlEditor}>
        <label htmlFor={`sql-${lab.id}`}>sua entrada (será concatenada na query)</label>
        <textarea
          id={`sql-${lab.id}`}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          spellCheck={false}
          rows={2}
        />
      </div>
      <div className={styles.acLabActions}>
        <button type="button" className={styles.acRunBtn} onClick={run}><Play size={14} /> executar query</button>
        <button type="button" className={styles.acGhostBtn} onClick={() => { setInput(lab.starter); setResult(null); }}>
          <RotateCcw size={12} /> restaurar
        </button>
      </div>

      {result && (
        <div className={styles.acSqlResult}>
          <div className={styles.acSqlQuery}><span>SQL executado</span><pre><code>{result.query}</code></pre></div>
          {result.error ? (
            <div className={styles.acSqlError}><X size={13} /> erro de sintaxe: {result.error}</div>
          ) : (
            <SqlTable result={result} />
          )}
        </div>
      )}

      {success ? (
        <SolvedDebrief debrief={lab.debrief} solution={lab.solution} technique={technique} labTitle={lab.title} goal={lab.goal} reports={reports} />
      ) : (
        <MentorBox technique={technique} labTitle={lab.title} scenario={lab.scenario} goal={lab.goal} attempt={`Entrada SQL: ${input}`} reports={reports} onHint={onHint} />
      )}
    </LabShell>
  );
}

function SqlTable({ result }: { result: ReturnType<typeof runVulnerableQuery> }) {
  const rows = result.rows.slice(0, 20);
  if (rows.length === 0) {
    return <div className={styles.acSqlEmpty}>0 linhas retornadas.</div>;
  }
  return (
    <div className={styles.acTableWrap}>
      <table className={styles.acTable}>
        <thead>
          <tr>{result.columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {result.columns.map((column) => <td key={column}>{String(row[column] ?? '')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      <small>{result.rows.length} linha(s) retornada(s){result.rows.length > 20 ? ' · mostrando 20' : ''}</small>
    </div>
  );
}

// --- XSS ---------------------------------------------------------------------

function buildXssDoc(template: string, input: string): string {
  const rendered = template.replace('__INPUT__', input);
  const harness =
    `<!doctype html><html><head><meta charset="utf-8">` +
    `<style>body{font-family:Inter,system-ui,sans-serif;font-size:13px;color:#1a1a17;background:#fff;margin:0;padding:14px}.lab-note{color:#76746c;margin:0 0 10px;font-size:11px}.comment,.search{font-size:13px}</style>` +
    `<script>(function(){function fire(s){try{parent.postMessage({__xsslab:true,src:String(s)},'*')}catch(e){}}` +
    `window.alert=function(m){fire('alert:'+m)};window.prompt=function(){fire('prompt');return''};` +
    `window.confirm=function(){fire('confirm');return true};window.__xss=function(){fire('beacon')};})();</script>` +
    `</head><body><p class="lab-note">pré-visualização da página vulnerável · sandbox isolado</p>` +
    rendered +
    `</body></html>`;
  return harness;
}

function XssLabRunner({ lab, technique, reports, solved, onSolved, onAttempt, onHint }: { lab: XssLab } & RunnerShared) {
  const [input, setInput] = useState(lab.starter);
  const [doc, setDoc] = useState<string | null>(null);
  const [fired, setFired] = useState(false);
  const [ran, setRan] = useState(false);
  const [runCount, setRunCount] = useState(0);
  const firedRef = useRef(false);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const data = event.data as { __xsslab?: boolean } | null;
      if (data && data.__xsslab && !firedRef.current) {
        firedRef.current = true;
        setFired(true);
        onSolved();
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onSolved]);

  const run = () => {
    firedRef.current = false;
    setFired(false);
    setRan(true);
    setRunCount((count) => count + 1);
    onAttempt();
    setDoc(buildXssDoc(lab.template, input));
  };

  const success = solved || fired;

  return (
    <LabShell lab={lab} solved={solved} difficultyLabel={lab.difficulty}>
      <div className={styles.acQueryTemplate}>
        <span>onde sua entrada é refletida (contexto {lab.context})</span>
        <code>{lab.templateLabel}</code>
      </div>
      <div className={styles.acSqlEditor}>
        <label htmlFor={`xss-${lab.id}`}>seu payload</label>
        <textarea
          id={`xss-${lab.id}`}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          spellCheck={false}
          rows={2}
        />
      </div>
      <div className={styles.acLabActions}>
        <button type="button" className={styles.acRunBtn} onClick={run}><Play size={14} /> renderizar página</button>
        <button type="button" className={styles.acGhostBtn} onClick={() => { setInput(lab.starter); setDoc(null); setRan(false); }}>
          <RotateCcw size={12} /> restaurar
        </button>
      </div>

      {doc !== null && (
        <div className={styles.acXssStage}>
          <iframe key={runCount} title={`xss-${lab.id}`} sandbox="allow-scripts" srcDoc={doc} className={styles.acIframe} />
          {ran && !fired && !solved && (
            <div className={styles.acXssPending}>Página renderizada — mas nenhum script seu executou ainda. Ajuste o contexto.</div>
          )}
        </div>
      )}

      {success ? (
        <SolvedDebrief debrief={lab.debrief} solution={lab.solution} technique={technique} labTitle={lab.title} goal={lab.goal} reports={reports} />
      ) : (
        <MentorBox technique={technique} labTitle={lab.title} scenario={lab.scenario} goal={lab.goal} attempt={`Payload XSS: ${input}`} reports={reports} onHint={onHint} />
      )}
    </LabShell>
  );
}

// --- Challenge (AI-graded) ---------------------------------------------------

function ChallengeLabRunner({ lab, technique, reports, solved, onSolved, onAttempt, onHint }: { lab: ChallengeLab } & RunnerShared) {
  const [attempt, setAttempt] = useState(lab.starter);
  const [offlineResult, setOfflineResult] = useState<'idle' | 'pass' | 'fail'>('idle');
  const [grading, setGrading] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [feedback, setFeedback] = useState('');

  const checkOffline = () => {
    const normalized = attempt.toLowerCase();
    const pass = lab.expected.every((token) => normalized.includes(token.toLowerCase()));
    setOfflineResult(pass ? 'pass' : 'fail');
    onAttempt();
    if (pass) onSolved();
  };

  const gradeWithMentor = async () => {
    setGrading(true);
    setFeedback('');
    setVerdict(null);
    onAttempt();
    const result = await mentorGrade(
      { moduleTitle: technique, technique, labTitle: lab.title, scenario: lab.scenario, goal: lab.goal, attempt },
      reports,
    );
    setVerdict(result.verdict);
    setFeedback(result.text);
    if (result.verdict === 'SUCESSO') onSolved();
    setGrading(false);
  };

  const success = solved || offlineResult === 'pass' || verdict === 'SUCESSO';

  return (
    <LabShell lab={lab} solved={solved} difficultyLabel={lab.difficulty}>
      <div className={styles.acSqlEditor}>
        <label htmlFor={`ch-${lab.id}`}>edite a requisição</label>
        <textarea
          id={`ch-${lab.id}`}
          value={attempt}
          onChange={(event) => { setAttempt(event.target.value); setOfflineResult('idle'); }}
          spellCheck={false}
          rows={6}
        />
      </div>
      <div className={styles.acLabActions}>
        <button type="button" className={styles.acRunBtn} onClick={checkOffline}><Play size={14} /> testar no lab</button>
        <button type="button" className={styles.acHintBtn} onClick={gradeWithMentor} disabled={grading}>
          {grading ? <LoaderCircle size={13} className={styles.spin} /> : <BrainCircuit size={13} />}
          {grading ? 'avaliando…' : 'avaliar com mentor'}
        </button>
      </div>

      {offlineResult !== 'idle' && (
        <div className={offlineResult === 'pass' ? styles.acRespOk : styles.acRespFail}>
          <pre><code>{offlineResult === 'pass' ? lab.successResponse : lab.failureResponse}</code></pre>
        </div>
      )}

      {verdict && (
        <div className={`${styles.acVerdict} ${verdict === 'SUCESSO' ? styles.acVerdictOk : verdict === 'PARCIAL' ? styles.acVerdictMid : styles.acVerdictBad}`}>
          <strong>{verdict === 'SUCESSO' ? <Check size={14} /> : <X size={14} />} veredito do mentor: {verdict.toLowerCase()}</strong>
          {feedback.split('\n').filter(Boolean).map((line, index) => <p key={index}>{line}</p>)}
        </div>
      )}

      {success ? (
        <SolvedDebrief debrief={lab.debrief} solution={lab.solution} technique={technique} labTitle={lab.title} goal={lab.goal} reports={reports} />
      ) : (
        <MentorBox technique={technique} labTitle={lab.title} scenario={lab.scenario} goal={lab.goal} attempt={attempt} reports={reports} onHint={onHint} />
      )}
    </LabShell>
  );
}

// ===========================================================================
// Quiz section
// ===========================================================================

function QuizSection({
  module,
  progress,
  onAnswered,
}: {
  module: Module;
  progress: Progress;
  onAnswered: (id: string, correct: boolean) => void;
}) {
  const [choices, setChoices] = useState<Record<string, number>>({});

  const pick = (questionId: string, optionIndex: number, correctIndex: number) => {
    if (choices[questionId] !== undefined) return;
    setChoices((current) => ({ ...current, [questionId]: optionIndex }));
    onAnswered(questionId, optionIndex === correctIndex);
  };

  return (
    <div className={styles.acQuiz}>
      {module.quiz.map((question, qIndex) => {
        const chosen = choices[question.id];
        const answered = chosen !== undefined || progress.completedQuiz.includes(question.id);
        return (
          <article key={question.id} className={styles.acQuizCard}>
            <span className={styles.acQuizNum}>{qIndex + 1}</span>
            <strong className={styles.acQuizPrompt}>{question.prompt}</strong>
            <div className={styles.acQuizOptions}>
              {question.options.map((option, oIndex) => {
                const isCorrect = oIndex === question.answer;
                const isChosen = chosen === oIndex;
                let className = styles.acQuizOption;
                if (chosen !== undefined) {
                  if (isCorrect) className = styles.acQuizCorrect;
                  else if (isChosen) className = styles.acQuizWrong;
                  else className = styles.acQuizMuted;
                }
                return (
                  <button key={option} type="button" className={className} onClick={() => pick(question.id, oIndex, question.answer)} disabled={chosen !== undefined}>
                    <span>{chosen !== undefined && isCorrect ? <Check size={13} /> : chosen !== undefined && isChosen ? <X size={13} /> : null}</span>
                    {option}
                  </button>
                );
              })}
            </div>
            {answered && chosen !== undefined && (
              <p className={styles.acQuizExplain}><Sparkles size={12} /> {question.explanation}</p>
            )}
          </article>
        );
      })}
    </div>
  );
}

// ===========================================================================
// Real-world section — connects technique to live HackerOne disclosures
// ===========================================================================

function RealWorldSection({
  reports,
  loading,
  technique,
}: {
  reports: BBLabReport[];
  loading: boolean;
  technique: string | null;
}) {
  if (loading) {
    return <div className={styles.acEmpty}>carregando disclosures reais…</div>;
  }
  if (reports.length === 0) {
    return <div className={styles.acEmpty}>nenhum report de {technique ?? 'tema'} carregado no momento. Abra a aba reports para sincronizar.</div>;
  }
  return (
    <div className={styles.acReal}>
      <p className={styles.acRealIntro}>
        <ShieldCheck size={14} /> A teoria deste módulo aparecendo em programas reais. Estude o original e veja o padrão que você acabou de praticar.
      </p>
      <div className={styles.acRealGrid}>
        {reports.slice(0, 8).map((report) => (
          <a key={report.id} href={report.url} target="_blank" rel="noreferrer" className={styles.acRealCard}>
            <span className={styles.acRealMeta}>{report.program} · {report.severity}</span>
            <strong>{report.titleOriginal}</strong>
            <small>{report.summaryPt}</small>
            <span className={styles.acRealLink}>{report.technique} <ArrowUpRight size={12} /></span>
          </a>
        ))}
      </div>
    </div>
  );
}
