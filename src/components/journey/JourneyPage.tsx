'use client';

import {
  ArrowRight,
  Award,
  BookMarked,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleHelp,
  Clock3,
  ExternalLink,
  FileBadge,
  FolderGit2,
  Lightbulb,
  LoaderCircle,
  Lock,
  LogIn,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Target,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import SiteFooter from '@/components/site/SiteFooter';
import SiteHeader from '@/components/site/SiteHeader';
import { getPrivateFileUrl, uploadPrivateFile } from '@/lib/supabase/storage';
import { useOwner } from '@/lib/useOwner';
import { loadJourney, saveJourney } from '@/lib/journey/store';
import {
  EMPTY_JOURNEY,
  blankCertificate,
  blankLibraryItem,
  blankProject,
  blankQuestion,
  newJourneyId,
  nowIso,
  todayDate,
  type CertificateStatus,
  type JourneyCertificate,
  type JourneyData,
  type JourneyProject,
  type JourneyQuestion,
  type LibraryItem,
  type LibraryKind,
  type LibraryStatus,
  type ProjectStatus,
  type QuestionStatus,
} from '@/lib/journey/types';
import styles from './Journey.module.css';

type JourneyTab = 'overview' | 'questions' | 'library' | 'certificates' | 'projects';
type EditorState =
  | { kind: 'question'; item: JourneyQuestion }
  | { kind: 'library'; item: LibraryItem }
  | { kind: 'certificate'; item: JourneyCertificate }
  | { kind: 'project'; item: JourneyProject }
  | null;

const TABS: Array<{ key: JourneyTab; label: string }> = [
  { key: 'overview', label: 'visão geral' },
  { key: 'questions', label: 'perguntas' },
  { key: 'library', label: 'biblioteca' },
  { key: 'certificates', label: 'certificados' },
  { key: 'projects', label: 'projetos' },
];

const QUESTION_LABEL: Record<QuestionStatus, string> = {
  open: 'aberta',
  testing: 'investigando',
  resolved: 'resolvida',
};

const LIBRARY_KIND_LABEL: Record<LibraryKind, string> = {
  book: 'livro',
  course: 'curso',
  video: 'vídeo',
  article: 'artigo',
  lab: 'lab',
};

const LIBRARY_STATUS_LABEL: Record<LibraryStatus, string> = {
  wishlist: 'quero estudar',
  'in-progress': 'estudando',
  completed: 'concluído',
  abandoned: 'abandonado',
};

const CERTIFICATE_STATUS_LABEL: Record<CertificateStatus, string> = {
  planned: 'planejado',
  earning: 'em preparação',
  earned: 'conquistado',
};

const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  idea: 'ideia',
  active: 'ativo',
  paused: 'pausado',
  completed: 'concluído',
};

function formatDate(value: string): string {
  if (!value) return '';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(`${value.slice(0, 10)}T12:00:00`));
}

function percent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value || 0)));
}

export default function JourneyPage() {
  const { isOwner, isReady } = useOwner();
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <SiteHeader active="jornada" />
        {!isReady ? <div className={styles.empty}>verificando sessão…</div> : !isOwner ? <AuthGate /> : <Journey />}
        <SiteFooter />
      </div>
    </div>
  );
}

function AuthGate() {
  return (
    <div className={styles.gate}>
      <Lock size={26} />
      <h1>Sua jornada é privada</h1>
      <p>Perguntas, cursos, certificados e projetos ficam disponíveis apenas para sua conta.</p>
      <Link href="/login?next=/jornada" className={styles.primaryButton}><LogIn size={15} /> entrar</Link>
    </div>
  );
}

function Journey() {
  const [data, setData] = useState<JourneyData>(EMPTY_JOURNEY);
  const [activeTab, setActiveTab] = useState<JourneyTab>('overview');
  const [editor, setEditor] = useState<EditorState>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dbWarn, setDbWarn] = useState(false);

  useEffect(() => {
    let active = true;
    void loadJourney().then((loaded) => {
      if (!active) return;
      setData(loaded);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const persist = async (next: JourneyData) => {
    const stamped = { ...next, updatedAt: nowIso() };
    setData(stamped);
    setSaving(true);
    const ok = await saveJourney(stamped);
    setSaving(false);
    setDbWarn(!ok);
  };

  const saveQuestion = (item: JourneyQuestion) => {
    const current = data.questions.find((entry) => entry.id === item.id);
    const wasResolved = current?.status === 'resolved';
    const resolvedAt = item.status === 'resolved'
      ? item.resolvedAt || nowIso()
      : wasResolved ? '' : item.resolvedAt;
    void persist({
      ...data,
      questions: [{ ...item, resolvedAt, updatedAt: nowIso() }, ...data.questions.filter((entry) => entry.id !== item.id)],
    });
    setEditor(null);
  };

  const saveLibraryItem = (item: LibraryItem) => {
    const completedAt = item.status === 'completed' ? item.completedAt || todayDate() : item.completedAt;
    void persist({
      ...data,
      library: [{ ...item, progress: item.status === 'completed' ? 100 : percent(item.progress), completedAt, updatedAt: nowIso() }, ...data.library.filter((entry) => entry.id !== item.id)],
    });
    setEditor(null);
  };

  const saveCertificate = (item: JourneyCertificate) => {
    void persist({
      ...data,
      certificates: [{ ...item, updatedAt: nowIso() }, ...data.certificates.filter((entry) => entry.id !== item.id)],
    });
    setEditor(null);
  };

  const saveProject = (item: JourneyProject) => {
    const completedAt = item.status === 'completed' ? item.completedAt || todayDate() : item.completedAt;
    void persist({
      ...data,
      projects: [{ ...item, completedAt, updatedAt: nowIso() }, ...data.projects.filter((entry) => entry.id !== item.id)],
    });
    setEditor(null);
  };

  const remove = (kind: Exclude<JourneyTab, 'overview'>, id: string) => {
    if (!window.confirm('Excluir este registro? Essa ação não pode ser desfeita.')) return;
    if (kind === 'questions') void persist({ ...data, questions: data.questions.filter((item) => item.id !== id) });
    if (kind === 'library') void persist({ ...data, library: data.library.filter((item) => item.id !== id) });
    if (kind === 'certificates') void persist({ ...data, certificates: data.certificates.filter((item) => item.id !== id) });
    if (kind === 'projects') void persist({ ...data, projects: data.projects.filter((item) => item.id !== id) });
  };

  const openNew = (tab: JourneyTab = activeTab) => {
    if (tab === 'questions') setEditor({ kind: 'question', item: blankQuestion() });
    if (tab === 'library') setEditor({ kind: 'library', item: blankLibraryItem() });
    if (tab === 'certificates') setEditor({ kind: 'certificate', item: blankCertificate() });
    if (tab === 'projects') setEditor({ kind: 'project', item: blankProject() });
  };

  if (loading) return <div className={styles.empty}>carregando sua jornada…</div>;

  return (
    <>
      <section className={styles.hero}>
        <div>
          <div className={styles.eyebrow}>registro pessoal de evolução</div>
          <h1>Jornada</h1>
          <p>O lugar onde dúvidas viram respostas, estudos viram repertório e projetos viram história.</p>
        </div>
        <div className={styles.saveState}>
          {saving ? <><LoaderCircle size={13} className={styles.spin} /> salvando</> : <><Check size={13} /> atualizado</>}
        </div>
      </section>

      {dbWarn && (
        <div className={styles.warning}>
          Os dados estão seguros neste navegador, mas ainda não chegaram ao banco. Aplique a migração <code>202606220001_journey.sql</code>.
        </div>
      )}

      <nav className={styles.tabs} aria-label="Áreas da jornada">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={activeTab === tab.key ? styles.tabActive : styles.tab}
            onClick={() => { setActiveTab(tab.key); setEditor(null); }}
          >
            {tab.label}
            {tab.key !== 'overview' && <span>{data[tab.key].length}</span>}
          </button>
        ))}
      </nav>

      {editor ? (
        <Editor
          state={editor}
          onCancel={() => setEditor(null)}
          onQuestion={saveQuestion}
          onLibrary={saveLibraryItem}
          onCertificate={saveCertificate}
          onProject={saveProject}
        />
      ) : activeTab === 'overview' ? (
        <Overview data={data} onNavigate={setActiveTab} onNew={openNew} />
      ) : activeTab === 'questions' ? (
        <Questions items={data.questions} onNew={() => openNew('questions')} onEdit={(item) => setEditor({ kind: 'question', item })} onDelete={(id) => remove('questions', id)} />
      ) : activeTab === 'library' ? (
        <Library items={data.library} onNew={() => openNew('library')} onEdit={(item) => setEditor({ kind: 'library', item })} onDelete={(id) => remove('library', id)} />
      ) : activeTab === 'certificates' ? (
        <Certificates items={data.certificates} onNew={() => openNew('certificates')} onEdit={(item) => setEditor({ kind: 'certificate', item })} onDelete={(id) => remove('certificates', id)} />
      ) : (
        <Projects items={data.projects} onNew={() => openNew('projects')} onEdit={(item) => setEditor({ kind: 'project', item })} onDelete={(id) => remove('projects', id)} />
      )}
    </>
  );
}

function Overview({
  data,
  onNavigate,
  onNew,
}: {
  data: JourneyData;
  onNavigate: (tab: JourneyTab) => void;
  onNew: (tab: JourneyTab) => void;
}) {
  const activeStudies = data.library.filter((item) => item.status === 'in-progress');
  const openQuestions = data.questions.filter((item) => item.status !== 'resolved');
  const activeProjects = data.projects.filter((item) => item.status === 'active');
  const upcomingCertificates = data.certificates
    .filter((item) => item.status !== 'earned')
    .sort((a, b) => (a.targetAt || '9999').localeCompare(b.targetAt || '9999'));

  const timeline = [
    ...data.questions.filter((item) => item.resolvedAt).map((item) => ({ date: item.resolvedAt, icon: CircleHelp, label: 'pergunta resolvida', title: item.title })),
    ...data.library.filter((item) => item.completedAt).map((item) => ({ date: item.completedAt, icon: BookMarked, label: `${LIBRARY_KIND_LABEL[item.kind]} concluído`, title: item.title })),
    ...data.certificates.filter((item) => item.status === 'earned' && item.issuedAt).map((item) => ({ date: item.issuedAt, icon: Award, label: 'certificado conquistado', title: item.title })),
    ...data.projects.filter((item) => item.completedAt).map((item) => ({ date: item.completedAt, icon: FolderGit2, label: 'projeto concluído', title: item.title })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  return (
    <div className={styles.overview}>
      <section className={styles.metrics}>
        <button type="button" onClick={() => onNavigate('questions')}><CircleHelp /><span>perguntas abertas</span><strong>{openQuestions.length}</strong></button>
        <button type="button" onClick={() => onNavigate('library')}><BookMarked /><span>em andamento</span><strong>{activeStudies.length}</strong></button>
        <button type="button" onClick={() => onNavigate('projects')}><FolderGit2 /><span>projetos ativos</span><strong>{activeProjects.length}</strong></button>
        <button type="button" onClick={() => onNavigate('certificates')}><Award /><span>certificados</span><strong>{data.certificates.filter((item) => item.status === 'earned').length}</strong></button>
      </section>

      <section className={styles.quickAdd}>
        <span>registrar agora</span>
        <button type="button" onClick={() => onNew('questions')}><Plus size={13} /> pergunta</button>
        <button type="button" onClick={() => onNew('library')}><Plus size={13} /> estudo</button>
        <button type="button" onClick={() => onNew('projects')}><Plus size={13} /> projeto</button>
        <button type="button" onClick={() => onNew('certificates')}><Plus size={13} /> certificado</button>
      </section>

      <div className={styles.overviewGrid}>
        <section className={styles.panel}>
          <PanelHead icon={<BookMarked size={16} />} title="Continuar estudando" action="ver biblioteca" onAction={() => onNavigate('library')} />
          {activeStudies.length === 0 ? (
            <EmptyMini text="Nada em andamento. Escolha o próximo material da sua lista." />
          ) : activeStudies.slice(0, 4).map((item) => (
            <div key={item.id} className={styles.progressItem}>
              <div><strong>{item.title}</strong><span>{item.provider || LIBRARY_KIND_LABEL[item.kind]}</span></div>
              <div className={styles.progressTrack}><span style={{ width: `${percent(item.progress)}%` }} /></div>
              <em>{percent(item.progress)}%</em>
            </div>
          ))}
        </section>

        <section className={styles.panel}>
          <PanelHead icon={<CircleHelp size={16} />} title="Perguntas em aberto" action="ver todas" onAction={() => onNavigate('questions')} />
          {openQuestions.length === 0 ? <EmptyMini text="Nenhuma dúvida pendente. Um raro momento de paz." /> : openQuestions.slice(0, 4).map((item) => (
            <div key={item.id} className={styles.attentionItem}>
              <span className={`${styles.statusDot} ${styles[`status_${item.status}`]}`} />
              <div><strong>{item.title}</strong><small>{QUESTION_LABEL[item.status]}</small></div>
            </div>
          ))}
        </section>

        <section className={styles.panel}>
          <PanelHead icon={<FolderGit2 size={16} />} title="Projetos ativos" action="ver projetos" onAction={() => onNavigate('projects')} />
          {activeProjects.length === 0 ? <EmptyMini text="Nenhum projeto ativo no momento." /> : activeProjects.slice(0, 3).map((item) => {
            const done = item.tasks.filter((task) => task.done).length;
            return (
              <div key={item.id} className={styles.projectMini}>
                <div><strong>{item.title}</strong><span>{done}/{item.tasks.length} tarefas</span></div>
                {item.targetAt && <small><CalendarDays size={11} /> {formatDate(item.targetAt)}</small>}
              </div>
            );
          })}
        </section>

        <section className={styles.panel}>
          <PanelHead icon={<Target size={16} />} title="Próximos certificados" action="ver certificados" onAction={() => onNavigate('certificates')} />
          {upcomingCertificates.length === 0 ? <EmptyMini text="Nenhum certificado planejado." /> : upcomingCertificates.slice(0, 3).map((item) => (
            <div key={item.id} className={styles.certificateMini}>
              <Award size={15} />
              <div><strong>{item.title}</strong><span>{item.issuer || CERTIFICATE_STATUS_LABEL[item.status]}</span></div>
              {item.targetAt && <small>{formatDate(item.targetAt)}</small>}
            </div>
          ))}
        </section>
      </div>

      <section className={styles.timelinePanel}>
        <PanelHead icon={<Sparkles size={16} />} title="Sua linha do tempo" />
        {timeline.length === 0 ? (
          <EmptyMini text="Suas conquistas aparecerão aqui conforme a jornada crescer." />
        ) : (
          <div className={styles.timeline}>
            {timeline.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={`${item.date}-${item.title}-${index}`} className={styles.timelineItem}>
                  <div className={styles.timelineIcon}><Icon size={14} /></div>
                  <div><small>{item.label}</small><strong>{item.title}</strong></div>
                  <time>{formatDate(item.date)}</time>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function PanelHead({ icon, title, action, onAction }: { icon: React.ReactNode; title: string; action?: string; onAction?: () => void }) {
  return (
    <div className={styles.panelHead}>
      <h2>{icon}{title}</h2>
      {action && <button type="button" onClick={onAction}>{action}<ArrowRight size={12} /></button>}
    </div>
  );
}

function EmptyMini({ text }: { text: string }) {
  return <p className={styles.emptyMini}>{text}</p>;
}

function SectionHeader({ title, description, label, onNew }: { title: string; description: string; label: string; onNew: () => void }) {
  return (
    <header className={styles.sectionHeader}>
      <div><h2>{title}</h2><p>{description}</p></div>
      <button type="button" className={styles.primaryButton} onClick={onNew}><Plus size={14} /> {label}</button>
    </header>
  );
}

function Questions({ items, onNew, onEdit, onDelete }: { items: JourneyQuestion[]; onNew: () => void; onEdit: (item: JourneyQuestion) => void; onDelete: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<QuestionStatus | 'all'>('all');
  const shown = items.filter((item) => (filter === 'all' || item.status === filter) && `${item.title} ${item.context} ${item.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <section>
      <SectionHeader title="Perguntas" description="Registre a dúvida, sua hipótese, o experimento e a resposta que encontrou." label="nova pergunta" onNew={onNew} />
      <Filters query={query} onQuery={setQuery}>
        <FilterButton on={filter === 'all'} onClick={() => setFilter('all')}>todas</FilterButton>
        {(Object.keys(QUESTION_LABEL) as QuestionStatus[]).map((status) => <FilterButton key={status} on={filter === status} onClick={() => setFilter(status)}>{QUESTION_LABEL[status]}</FilterButton>)}
      </Filters>
      <div className={styles.cardList}>
        {shown.map((item) => (
          <article key={item.id} className={styles.recordCard}>
            <div className={styles.recordTop}>
              <span className={`${styles.badge} ${styles[`badge_${item.status}`]}`}>{QUESTION_LABEL[item.status]}</span>
              <CardActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} />
            </div>
            <h3>{item.title || 'Pergunta sem título'}</h3>
            {item.context && <p>{item.context}</p>}
            {item.hypothesis && <div className={styles.callout}><Lightbulb size={14} /><span><strong>hipótese</strong>{item.hypothesis}</span></div>}
            {item.status === 'resolved' && item.answer && <div className={styles.answer}><CheckCircle2 size={15} /><span><strong>resposta</strong>{item.answer}</span></div>}
            <Tags values={item.tags} />
          </article>
        ))}
        {shown.length === 0 && <div className={styles.empty}>Nenhuma pergunta por aqui.</div>}
      </div>
    </section>
  );
}

function Library({ items, onNew, onEdit, onDelete }: { items: LibraryItem[]; onNew: () => void; onEdit: (item: LibraryItem) => void; onDelete: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<LibraryStatus | 'all'>('all');
  const shown = items.filter((item) => (filter === 'all' || item.status === filter) && `${item.title} ${item.author} ${item.provider} ${item.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <section>
      <SectionHeader title="Biblioteca" description="Livros, cursos, vídeos, artigos e labs que formam seu repertório." label="adicionar material" onNew={onNew} />
      <Filters query={query} onQuery={setQuery}>
        <FilterButton on={filter === 'all'} onClick={() => setFilter('all')}>todos</FilterButton>
        {(Object.keys(LIBRARY_STATUS_LABEL) as LibraryStatus[]).map((status) => <FilterButton key={status} on={filter === status} onClick={() => setFilter(status)}>{LIBRARY_STATUS_LABEL[status]}</FilterButton>)}
      </Filters>
      <div className={styles.libraryGrid}>
        {shown.map((item) => (
          <article key={item.id} className={styles.libraryCard}>
            <div className={styles.recordTop}>
              <span className={styles.kind}>{LIBRARY_KIND_LABEL[item.kind]}</span>
              <CardActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} />
            </div>
            <h3>{item.title || 'Material sem título'}</h3>
            <p>{[item.author, item.provider].filter(Boolean).join(' · ') || LIBRARY_STATUS_LABEL[item.status]}</p>
            <div className={styles.libraryProgress}>
              <div><span style={{ width: `${percent(item.progress)}%` }} /></div><strong>{percent(item.progress)}%</strong>
            </div>
            <div className={styles.cardFooter}>
              <span className={`${styles.badge} ${styles[`badge_${item.status}`]}`}>{LIBRARY_STATUS_LABEL[item.status]}</span>
              {item.rating > 0 && <span>{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</span>}
            </div>
          </article>
        ))}
        {shown.length === 0 && <div className={styles.empty}>Sua estante está vazia neste filtro.</div>}
      </div>
    </section>
  );
}

function Certificates({ items, onNew, onEdit, onDelete }: { items: JourneyCertificate[]; onNew: () => void; onEdit: (item: JourneyCertificate) => void; onDelete: (id: string) => void }) {
  const openFile = async (item: JourneyCertificate) => {
    if (!item.filePath) return;
    try {
      const url = await getPrivateFileUrl(item.filePath);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      window.alert('Não consegui abrir o arquivo agora.');
    }
  };
  return (
    <section>
      <SectionHeader title="Certificados" description="Planeje certificações e preserve credenciais, competências e arquivos conquistados." label="novo certificado" onNew={onNew} />
      <div className={styles.certificateGrid}>
        {items.map((item) => (
          <article key={item.id} className={`${styles.certificateCard} ${item.status === 'earned' ? styles.certificateEarned : ''}`}>
            <div className={styles.certificateMark}><Award size={21} /></div>
            <div className={styles.recordTop}>
              <span className={`${styles.badge} ${styles[`badge_${item.status}`]}`}>{CERTIFICATE_STATUS_LABEL[item.status]}</span>
              <CardActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} />
            </div>
            <h3>{item.title || 'Certificado sem título'}</h3>
            <p>{item.issuer || 'Instituição não informada'}</p>
            <div className={styles.certificateDates}>
              {item.targetAt && <span><Target size={12} /> meta {formatDate(item.targetAt)}</span>}
              {item.issuedAt && <span><CalendarDays size={12} /> emitido {formatDate(item.issuedAt)}</span>}
              {item.expiresAt && <span><Clock3 size={12} /> expira {formatDate(item.expiresAt)}</span>}
            </div>
            <Tags values={item.skills} />
            <div className={styles.linkRow}>
              {item.credentialUrl && <a href={item.credentialUrl} target="_blank" rel="noreferrer"><ExternalLink size={12} /> credencial</a>}
              {item.filePath && <button type="button" onClick={() => void openFile(item)}><FileBadge size={12} /> {item.fileName || 'arquivo'}</button>}
            </div>
          </article>
        ))}
        {items.length === 0 && <div className={styles.empty}>Nenhum certificado cadastrado.</div>}
      </div>
    </section>
  );
}

function Projects({ items, onNew, onEdit, onDelete }: { items: JourneyProject[]; onNew: () => void; onEdit: (item: JourneyProject) => void; onDelete: (id: string) => void }) {
  return (
    <section>
      <SectionHeader title="Projetos" description="Acompanhe o que está construindo, as decisões tomadas e tudo que aprendeu no caminho." label="novo projeto" onNew={onNew} />
      <div className={styles.projectGrid}>
        {items.map((item) => {
          const done = item.tasks.filter((task) => task.done).length;
          const taskProgress = item.tasks.length ? Math.round((done / item.tasks.length) * 100) : 0;
          return (
            <article key={item.id} className={styles.projectCard}>
              <div className={styles.recordTop}>
                <span className={`${styles.badge} ${styles[`badge_${item.status}`]}`}>{PROJECT_STATUS_LABEL[item.status]}</span>
                <CardActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} />
              </div>
              <h3>{item.title || 'Projeto sem título'}</h3>
              <p>{item.summary || item.objective || 'Sem descrição ainda.'}</p>
              <Tags values={item.technologies} />
              <div className={styles.projectStats}>
                <span><CheckCircle2 size={13} /> {done}/{item.tasks.length} tarefas</span>
                <span><BookMarked size={13} /> {item.journal.length} registros</span>
                <span><Lightbulb size={13} /> {item.decisions.length} decisões</span>
              </div>
              <div className={styles.libraryProgress}><div><span style={{ width: `${taskProgress}%` }} /></div><strong>{taskProgress}%</strong></div>
              <div className={styles.linkRow}>
                {item.repoUrl && <a href={item.repoUrl} target="_blank" rel="noreferrer"><FolderGit2 size={12} /> repositório</a>}
                {item.demoUrl && <a href={item.demoUrl} target="_blank" rel="noreferrer"><ExternalLink size={12} /> projeto</a>}
              </div>
            </article>
          );
        })}
        {items.length === 0 && <div className={styles.empty}>Nenhum projeto cadastrado.</div>}
      </div>
    </section>
  );
}

function Filters({ query, onQuery, children }: { query: string; onQuery: (value: string) => void; children: React.ReactNode }) {
  return (
    <div className={styles.filters}>
      <label className={styles.search}><Search size={14} /><input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="buscar…" /></label>
      <div className={styles.filterButtons}>{children}</div>
    </div>
  );
}

function FilterButton({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" className={on ? styles.filterActive : styles.filterButton} onClick={onClick}>{children}</button>;
}

function CardActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className={styles.cardActions}>
      <button type="button" onClick={onEdit} aria-label="Editar"><Pencil size={13} /></button>
      <button type="button" onClick={onDelete} aria-label="Excluir"><Trash2 size={13} /></button>
    </div>
  );
}

function Tags({ values }: { values: string[] }) {
  if (values.length === 0) return null;
  return <div className={styles.tags}>{values.map((value) => <span key={value}>{value}</span>)}</div>;
}

function Editor({
  state,
  onCancel,
  onQuestion,
  onLibrary,
  onCertificate,
  onProject,
}: {
  state: NonNullable<EditorState>;
  onCancel: () => void;
  onQuestion: (item: JourneyQuestion) => void;
  onLibrary: (item: LibraryItem) => void;
  onCertificate: (item: JourneyCertificate) => void;
  onProject: (item: JourneyProject) => void;
}) {
  if (state.kind === 'question') return <QuestionEditor initial={state.item} onCancel={onCancel} onSave={onQuestion} />;
  if (state.kind === 'library') return <LibraryEditor initial={state.item} onCancel={onCancel} onSave={onLibrary} />;
  if (state.kind === 'certificate') return <CertificateEditor initial={state.item} onCancel={onCancel} onSave={onCertificate} />;
  return <ProjectEditor initial={state.item} onCancel={onCancel} onSave={onProject} />;
}

function EditorShell({ title, subtitle, onCancel, onSubmit, canSave, children }: { title: string; subtitle: string; onCancel: () => void; onSubmit: () => void; canSave: boolean; children: React.ReactNode }) {
  return (
    <section className={styles.editor}>
      <header className={styles.editorHeader}>
        <div><button type="button" onClick={onCancel}><X size={13} /> fechar</button><h2>{title}</h2><p>{subtitle}</p></div>
        <button type="button" className={styles.primaryButton} disabled={!canSave} onClick={onSubmit}><Check size={14} /> salvar</button>
      </header>
      {children}
    </section>
  );
}

function QuestionEditor({ initial, onCancel, onSave }: { initial: JourneyQuestion; onCancel: () => void; onSave: (item: JourneyQuestion) => void }) {
  const [draft, setDraft] = useState(initial);
  const patch = (partial: Partial<JourneyQuestion>) => setDraft((current) => ({ ...current, ...partial }));
  return (
    <EditorShell title={initial.title ? 'Editar pergunta' : 'Nova pergunta'} subtitle="Guarde o raciocínio, não apenas a resposta final." onCancel={onCancel} onSubmit={() => onSave(draft)} canSave={Boolean(draft.title.trim())}>
      <div className={styles.formGrid}>
        <Field label="pergunta" wide><input autoFocus value={draft.title} onChange={(event) => patch({ title: event.target.value })} placeholder="O que você quer entender?" /></Field>
        <Field label="estado"><select value={draft.status} onChange={(event) => patch({ status: event.target.value as QuestionStatus })}>{(Object.keys(QUESTION_LABEL) as QuestionStatus[]).map((status) => <option key={status} value={status}>{QUESTION_LABEL[status]}</option>)}</select></Field>
        <Field label="fonte"><input value={draft.sourceUrl} onChange={(event) => patch({ sourceUrl: event.target.value })} placeholder="https://…" /></Field>
        <Field label="contexto" wide><textarea value={draft.context} onChange={(event) => patch({ context: event.target.value })} placeholder="Onde essa dúvida apareceu? O que você já sabe?" /></Field>
        <Field label="hipótese atual" wide><textarea value={draft.hypothesis} onChange={(event) => patch({ hypothesis: event.target.value })} placeholder="Qual é sua explicação antes de pesquisar?" /></Field>
        <Field label="experimento realizado" wide><textarea value={draft.experiment} onChange={(event) => patch({ experiment: event.target.value })} placeholder="O que você testou para validar ou refutar a hipótese?" /></Field>
        <Field label="resposta encontrada" wide><textarea className={styles.tallArea} value={draft.answer} onChange={(event) => patch({ answer: event.target.value })} placeholder="Escreva a resposta com suas próprias palavras." /></Field>
        <Field label="tags" wide><TagField values={draft.tags} onChange={(tags) => patch({ tags })} placeholder="rede, web, linux…" /></Field>
      </div>
    </EditorShell>
  );
}

function LibraryEditor({ initial, onCancel, onSave }: { initial: LibraryItem; onCancel: () => void; onSave: (item: LibraryItem) => void }) {
  const [draft, setDraft] = useState(initial);
  const patch = (partial: Partial<LibraryItem>) => setDraft((current) => ({ ...current, ...partial }));
  return (
    <EditorShell title={initial.title ? 'Editar material' : 'Adicionar à biblioteca'} subtitle="Registre o que pretende estudar e o que realmente levou dali." onCancel={onCancel} onSubmit={() => onSave(draft)} canSave={Boolean(draft.title.trim())}>
      <div className={styles.formGrid}>
        <Field label="título" wide><input autoFocus value={draft.title} onChange={(event) => patch({ title: event.target.value })} placeholder="Nome do livro, curso, vídeo, artigo ou lab" /></Field>
        <Field label="tipo"><select value={draft.kind} onChange={(event) => patch({ kind: event.target.value as LibraryKind })}>{(Object.keys(LIBRARY_KIND_LABEL) as LibraryKind[]).map((kind) => <option key={kind} value={kind}>{LIBRARY_KIND_LABEL[kind]}</option>)}</select></Field>
        <Field label="estado"><select value={draft.status} onChange={(event) => patch({ status: event.target.value as LibraryStatus })}>{(Object.keys(LIBRARY_STATUS_LABEL) as LibraryStatus[]).map((status) => <option key={status} value={status}>{LIBRARY_STATUS_LABEL[status]}</option>)}</select></Field>
        <Field label="autor"><input value={draft.author} onChange={(event) => patch({ author: event.target.value })} /></Field>
        <Field label="plataforma / editora"><input value={draft.provider} onChange={(event) => patch({ provider: event.target.value })} /></Field>
        <Field label="link" wide><input value={draft.url} onChange={(event) => patch({ url: event.target.value })} placeholder="https://…" /></Field>
        <Field label={`progresso · ${percent(draft.progress)}%`} wide><input className={styles.range} type="range" min={0} max={100} step={5} value={draft.progress} onChange={(event) => patch({ progress: Number(event.target.value) })} /></Field>
        <Field label="início"><input type="date" value={draft.startedAt} onChange={(event) => patch({ startedAt: event.target.value })} /></Field>
        <Field label="conclusão"><input type="date" value={draft.completedAt} onChange={(event) => patch({ completedAt: event.target.value })} /></Field>
        <Field label="avaliação"><select value={draft.rating} onChange={(event) => patch({ rating: Number(event.target.value) })}><option value={0}>sem avaliação</option>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} estrela{value > 1 ? 's' : ''}</option>)}</select></Field>
        <Field label="tags"><TagField values={draft.tags} onChange={(tags) => patch({ tags })} placeholder="tema, tecnologia…" /></Field>
        <Field label="anotações" wide><textarea value={draft.notes} onChange={(event) => patch({ notes: event.target.value })} placeholder="Observações durante o estudo." /></Field>
        <Field label="aprendizados extraídos" wide><textarea className={styles.tallArea} value={draft.learnings} onChange={(event) => patch({ learnings: event.target.value })} placeholder="O que ficou depois de concluir?" /></Field>
      </div>
    </EditorShell>
  );
}

function CertificateEditor({ initial, onCancel, onSave }: { initial: JourneyCertificate; onCancel: () => void; onSave: (item: JourneyCertificate) => void }) {
  const [draft, setDraft] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const patch = (partial: Partial<JourneyCertificate>) => setDraft((current) => ({ ...current, ...partial }));
  const upload = async (file: File) => {
    setUploading(true);
    try {
      const filePath = await uploadPrivateFile(file, 'journey-certificates');
      patch({ filePath, fileName: file.name });
    } catch {
      window.alert('Não consegui enviar o arquivo.');
    } finally {
      setUploading(false);
    }
  };
  return (
    <EditorShell title={initial.title ? 'Editar certificado' : 'Novo certificado'} subtitle="Planeje a conquista ou arquive uma credencial que já é sua." onCancel={onCancel} onSubmit={() => onSave(draft)} canSave={Boolean(draft.title.trim()) && !uploading}>
      <div className={styles.formGrid}>
        <Field label="certificação" wide><input autoFocus value={draft.title} onChange={(event) => patch({ title: event.target.value })} placeholder="Nome da certificação" /></Field>
        <Field label="instituição"><input value={draft.issuer} onChange={(event) => patch({ issuer: event.target.value })} /></Field>
        <Field label="estado"><select value={draft.status} onChange={(event) => patch({ status: event.target.value as CertificateStatus })}>{(Object.keys(CERTIFICATE_STATUS_LABEL) as CertificateStatus[]).map((status) => <option key={status} value={status}>{CERTIFICATE_STATUS_LABEL[status]}</option>)}</select></Field>
        <Field label="data-meta"><input type="date" value={draft.targetAt} onChange={(event) => patch({ targetAt: event.target.value })} /></Field>
        <Field label="emissão"><input type="date" value={draft.issuedAt} onChange={(event) => patch({ issuedAt: event.target.value })} /></Field>
        <Field label="validade"><input type="date" value={draft.expiresAt} onChange={(event) => patch({ expiresAt: event.target.value })} /></Field>
        <Field label="id da credencial"><input value={draft.credentialId} onChange={(event) => patch({ credentialId: event.target.value })} /></Field>
        <Field label="link da credencial" wide><input value={draft.credentialUrl} onChange={(event) => patch({ credentialUrl: event.target.value })} placeholder="https://…" /></Field>
        <Field label="competências" wide><TagField values={draft.skills} onChange={(skills) => patch({ skills })} placeholder="pentest, redes, cloud…" /></Field>
        <Field label="arquivo do certificado" wide>
          <label className={styles.uploadField}>
            <Upload size={15} />
            <span>{uploading ? 'enviando…' : draft.fileName || 'selecionar PDF ou imagem'}</span>
            <input type="file" accept=".pdf,image/*" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} />
          </label>
        </Field>
        <Field label="observações" wide><textarea value={draft.notes} onChange={(event) => patch({ notes: event.target.value })} placeholder="Preparação, resultado, renovação ou contexto." /></Field>
      </div>
    </EditorShell>
  );
}

function ProjectEditor({ initial, onCancel, onSave }: { initial: JourneyProject; onCancel: () => void; onSave: (item: JourneyProject) => void }) {
  const [draft, setDraft] = useState(initial);
  const [task, setTask] = useState('');
  const [log, setLog] = useState('');
  const [decisionTitle, setDecisionTitle] = useState('');
  const [decisionReason, setDecisionReason] = useState('');
  const patch = (partial: Partial<JourneyProject>) => setDraft((current) => ({ ...current, ...partial }));
  const addTask = () => {
    if (!task.trim()) return;
    patch({ tasks: [...draft.tasks, { id: newJourneyId('task'), title: task.trim(), done: false }] });
    setTask('');
  };
  const addLog = () => {
    if (!log.trim()) return;
    patch({ journal: [{ id: newJourneyId('log'), date: todayDate(), text: log.trim() }, ...draft.journal] });
    setLog('');
  };
  const addDecision = () => {
    if (!decisionTitle.trim()) return;
    patch({ decisions: [{ id: newJourneyId('decision'), date: todayDate(), title: decisionTitle.trim(), reason: decisionReason.trim() }, ...draft.decisions] });
    setDecisionTitle('');
    setDecisionReason('');
  };
  return (
    <EditorShell title={initial.title ? 'Editar projeto' : 'Novo projeto'} subtitle="Um registro vivo do que você construiu e de como pensou durante o processo." onCancel={onCancel} onSubmit={() => onSave(draft)} canSave={Boolean(draft.title.trim())}>
      <div className={styles.formGrid}>
        <Field label="nome do projeto" wide><input autoFocus value={draft.title} onChange={(event) => patch({ title: event.target.value })} /></Field>
        <Field label="estado"><select value={draft.status} onChange={(event) => patch({ status: event.target.value as ProjectStatus })}>{(Object.keys(PROJECT_STATUS_LABEL) as ProjectStatus[]).map((status) => <option key={status} value={status}>{PROJECT_STATUS_LABEL[status]}</option>)}</select></Field>
        <Field label="data-meta"><input type="date" value={draft.targetAt} onChange={(event) => patch({ targetAt: event.target.value })} /></Field>
        <Field label="resumo" wide><textarea value={draft.summary} onChange={(event) => patch({ summary: event.target.value })} placeholder="Uma frase que explica o projeto." /></Field>
        <Field label="objetivo" wide><textarea value={draft.objective} onChange={(event) => patch({ objective: event.target.value })} placeholder="O que você quer construir, provar ou aprender?" /></Field>
        <Field label="tecnologias" wide><TagField values={draft.technologies} onChange={(technologies) => patch({ technologies })} placeholder="python, next.js, docker…" /></Field>
        <Field label="repositório"><input value={draft.repoUrl} onChange={(event) => patch({ repoUrl: event.target.value })} placeholder="https://github.com/…" /></Field>
        <Field label="demo / publicação"><input value={draft.demoUrl} onChange={(event) => patch({ demoUrl: event.target.value })} placeholder="https://…" /></Field>
        <Field label="início"><input type="date" value={draft.startedAt} onChange={(event) => patch({ startedAt: event.target.value })} /></Field>
        <Field label="conclusão"><input type="date" value={draft.completedAt} onChange={(event) => patch({ completedAt: event.target.value })} /></Field>
      </div>

      <div className={styles.editorSections}>
        <section className={styles.subEditor}>
          <h3><CheckCircle2 size={15} /> tarefas</h3>
          <div className={styles.inlineAdd}><input value={task} onChange={(event) => setTask(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addTask(); } }} placeholder="Próxima tarefa" /><button type="button" onClick={addTask}><Plus size={14} /></button></div>
          <div className={styles.taskList}>{draft.tasks.map((item) => (
            <div key={item.id} className={styles.taskRow}>
              <button type="button" onClick={() => patch({ tasks: draft.tasks.map((entry) => entry.id === item.id ? { ...entry, done: !entry.done } : entry) })}>{item.done ? <CheckCircle2 size={16} /> : <span />}</button>
              <span className={item.done ? styles.doneText : ''}>{item.title}</span>
              <button type="button" onClick={() => patch({ tasks: draft.tasks.filter((entry) => entry.id !== item.id) })}><X size={13} /></button>
            </div>
          ))}</div>
        </section>

        <section className={styles.subEditor}>
          <h3><BookMarked size={15} /> diário técnico</h3>
          <textarea value={log} onChange={(event) => setLog(event.target.value)} placeholder="O que avançou, travou ou descobriu hoje?" />
          <button type="button" className={styles.secondaryButton} onClick={addLog}><Plus size={13} /> adicionar registro</button>
          <div className={styles.logList}>{draft.journal.map((item) => <article key={item.id}><time>{formatDate(item.date)}</time><p>{item.text}</p><button type="button" onClick={() => patch({ journal: draft.journal.filter((entry) => entry.id !== item.id) })}><Trash2 size={12} /></button></article>)}</div>
        </section>

        <section className={styles.subEditor}>
          <h3><Lightbulb size={15} /> decisões</h3>
          <input value={decisionTitle} onChange={(event) => setDecisionTitle(event.target.value)} placeholder="Decisão tomada" />
          <textarea value={decisionReason} onChange={(event) => setDecisionReason(event.target.value)} placeholder="Por que você escolheu esse caminho?" />
          <button type="button" className={styles.secondaryButton} onClick={addDecision}><Plus size={13} /> registrar decisão</button>
          <div className={styles.logList}>{draft.decisions.map((item) => <article key={item.id}><time>{formatDate(item.date)}</time><strong>{item.title}</strong><p>{item.reason}</p><button type="button" onClick={() => patch({ decisions: draft.decisions.filter((entry) => entry.id !== item.id) })}><Trash2 size={12} /></button></article>)}</div>
        </section>

        <section className={styles.subEditor}>
          <h3><Sparkles size={15} /> aprendizados</h3>
          <textarea className={styles.tallArea} value={draft.learnings} onChange={(event) => patch({ learnings: event.target.value })} placeholder="O que este projeto ensinou sobre tecnologia, processo e suas próprias decisões?" />
        </section>
      </div>
    </EditorShell>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={wide ? styles.fieldWide : styles.field}><span>{label}</span>{children}</label>;
}

function TagField({ values, onChange, placeholder }: { values: string[]; onChange: (values: string[]) => void; placeholder: string }) {
  const [value, setValue] = useState('');
  const add = () => {
    const clean = value.trim().replace(/^#/, '');
    if (clean && !values.includes(clean)) onChange([...values, clean]);
    setValue('');
  };
  return (
    <div className={styles.tagField}>
      {values.map((item) => <span key={item}>{item}<button type="button" onClick={() => onChange(values.filter((value) => value !== item))}><X size={10} /></button></span>)}
      <input value={value} onChange={(event) => setValue(event.target.value)} onBlur={add} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); add(); } }} placeholder={placeholder} />
    </div>
  );
}
