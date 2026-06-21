'use client';

import {
  ArrowUpRight,
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleDollarSign,
  Code2,
  Filter,
  FlaskConical,
  Layers3,
  Lightbulb,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import SiteFooter from '@/components/site/SiteFooter';
import SiteHeader from '@/components/site/SiteHeader';
import MentorBB from './MentorBB';
import type {
  BBLabPublicDetail,
  BBLabReport,
  BBLabResponse,
  BBLabSeverity,
} from '@/types/bb-lab';
import styles from './BBLab.module.css';

type View = 'reports' | 'mentor' | 'practice';
type PaidFilter = 'all' | 'paid' | 'unpaid';

const SEVERITIES: Array<BBLabSeverity | 'Todas'> = ['Todas', 'Critical', 'High', 'Medium', 'Low'];
const REPORTS_PER_PAGE = 24;
const TRAILS_PER_PAGE = 6;

const SEVERITY_PT: Record<BBLabSeverity, string> = {
  Critical: 'crítica',
  High: 'alta',
  Medium: 'média',
  Low: 'baixa',
  None: 'não informada',
};

function cwePt(value: string) {
  const translations: Array<[RegExp, string]> = [
    [/improper access control/i, 'Controle de acesso inadequado'],
    [/cross-site scripting.*reflected/i, 'Cross-site scripting refletido'],
    [/cross-site scripting/i, 'Cross-site scripting'],
    [/uncontrolled resource consumption/i, 'Consumo descontrolado de recursos'],
    [/code injection/i, 'Injeção de código'],
    [/improper authentication/i, 'Autenticação inadequada'],
    [/reliance on untrusted inputs/i, 'Decisão de segurança baseada em entrada não confiável'],
    [/path traversal/i, 'Travessia de diretórios'],
    [/server-side request forgery/i, 'Falsificação de requisição pelo servidor'],
  ];
  return translations.find(([pattern]) => pattern.test(value))?.[1] || value;
}

function money(report: BBLabReport) {
  if (report.bounty === null) return 'recompensa não publicada';
  return `${report.currency} ${report.bounty.toLocaleString('pt-BR')}`;
}

function datePt(value: string) {
  if (!value) return 'data não informada';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function Pagination({
  current,
  total,
  onChange,
}: {
  current: number;
  total: number;
  onChange: (page: number) => void;
}) {
  if (total <= 1) return null;
  const pages = Array.from(
    new Set([1, total, current - 1, current, current + 1].filter((page) => page >= 1 && page <= total)),
  );

  return (
    <nav className={styles.pagination} aria-label="Paginação">
      <button type="button" disabled={current === 1} onClick={() => onChange(current - 1)}>
        <ChevronLeft size={14} /> anterior
      </button>
      <div>
        {pages.map((page, index) => (
          <span key={page}>
            {index > 0 && page - pages[index - 1] > 1 && <i>…</i>}
            <button
              type="button"
              onClick={() => onChange(page)}
              className={current === page ? styles.pageActive : styles.pageButton}
              aria-current={current === page ? 'page' : undefined}
            >
              {page}
            </button>
          </span>
        ))}
      </div>
      <button type="button" disabled={current === total} onClick={() => onChange(current + 1)}>
        próxima <ChevronRight size={14} />
      </button>
    </nav>
  );
}

export default function BBLabPage() {
  const [reports, setReports] = useState<BBLabReport[]>([]);
  const [total, setTotal] = useState(0);
  const [fetchedAt, setFetchedAt] = useState('');
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<View>('reports');
  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState<BBLabSeverity | 'Todas'>('Todas');
  const [paid, setPaid] = useState<PaidFilter>('all');
  const [technique, setTechnique] = useState('Todas');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, BBLabPublicDetail>>({});
  const [detailLoading, setDetailLoading] = useState<Record<string, boolean>>({});
  const [reportsPage, setReportsPage] = useState(1);
  const [practicePage, setPracticePage] = useState(1);

  const loadReports = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/bb-lab?page=0&size=1000');
      const payload = (await response.json()) as BBLabResponse & { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Não foi possível carregar os reports.');
      setReports(payload.reports);
      setTotal(payload.total);
      setFetchedAt(payload.fetchedAt);
      setSource(payload.source);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao consultar a Hacktivity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial synchronization with the public Hacktivity feed.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadReports();
  }, []);

  const techniques = useMemo(
    () => ['Todas', ...Array.from(new Set(reports.map((report) => report.technique))).sort()],
    [reports],
  );
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return reports.filter((report) => {
      const matchesQuery =
        !normalized ||
        [
          report.titlePt,
          report.titleOriginal,
          report.program,
          report.researcher,
          report.cwe,
          report.technique,
          ...report.tags,
        ].some((value) => value.toLowerCase().includes(normalized));
      const matchesSeverity = severity === 'Todas' || report.severity === severity;
      const matchesPaid =
        paid === 'all' ||
        (paid === 'paid' && report.bounty !== null && report.bounty > 0) ||
        (paid === 'unpaid' && (report.bounty === null || report.bounty === 0));
      const matchesTechnique = technique === 'Todas' || report.technique === technique;
      return matchesQuery && matchesSeverity && matchesPaid && matchesTechnique;
    });
  }, [reports, query, severity, paid, technique]);
  const reportsPageCount = Math.max(1, Math.ceil(filtered.length / REPORTS_PER_PAGE));
  const visibleReports = filtered.slice(
    (reportsPage - 1) * REPORTS_PER_PAGE,
    reportsPage * REPORTS_PER_PAGE,
  );

  const loadDetail = async (reportId: string) => {
    if (details[reportId] || detailLoading[reportId]) return;
    setDetailLoading((current) => ({ ...current, [reportId]: true }));
    try {
      const response = await fetch(`/api/bb-lab/${reportId}`);
      if (!response.ok) return;
      const detail = (await response.json()) as BBLabPublicDetail;
      setDetails((current) => ({ ...current, [reportId]: detail }));
    } finally {
      setDetailLoading((current) => ({ ...current, [reportId]: false }));
    }
  };

  const toggleReport = (reportId: string) => {
    const opening = selectedId !== reportId;
    setSelectedId(opening ? reportId : null);
    if (opening) void loadDetail(reportId);
  };

  const paidReports = useMemo(
    () => reports.filter((report) => report.bounty !== null && report.bounty > 0),
    [reports],
  );

  const practiceGroups = useMemo(() => {
    const groups = new Map<string, BBLabReport[]>();
    for (const report of reports) {
      groups.set(report.technique, [...(groups.get(report.technique) || []), report]);
    }
    return Array.from(groups.entries())
      .map(([name, items]) => ({ name, items }))
      .sort((a, b) => b.items.length - a.items.length);
  }, [reports]);
  const practicePageCount = Math.max(1, Math.ceil(practiceGroups.length / TRAILS_PER_PAGE));
  const visiblePracticeGroups = practiceGroups.slice(
    (practicePage - 1) * TRAILS_PER_PAGE,
    practicePage * TRAILS_PER_PAGE,
  );

  const totalBounties = paidReports.reduce((sum, report) => sum + (report.bounty || 0), 0);
  const criticalCount = reports.filter((report) => report.severity === 'Critical').length;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <SiteHeader active="bb-lab" />

        <section className={styles.hero}>
          <div>
            <div className={styles.eyebrow}>inteligência de campo · hackerone hacktivity</div>
            <h1 className={styles.title}>BB-Lab</h1>
            <p className={styles.subtitle}>
              Reports públicos transformados em repertório prático: entenda a falha, reconheça o
              bypass e converta o aprendizado em perguntas para o próximo alvo.
            </p>
          </div>
          <div className={styles.sourceCard}>
            <ShieldCheck size={18} />
            <div>
              <strong>Fonte rastreável</strong>
              <span>Somente disclosures públicos. Sempre confira o report original.</span>
            </div>
          </div>
        </section>

        <section className={styles.metrics} aria-label="Resumo da biblioteca">
          <article className={styles.metric}>
            <Layers3 size={17} />
            <span>reports carregados</span>
            <strong>{reports.length}</strong>
          </article>
          <article className={styles.metric}>
            <Target size={17} />
            <span>críticos</span>
            <strong>{criticalCount}</strong>
          </article>
          <article className={styles.metric}>
            <CircleDollarSign size={17} />
            <span>pagamentos visíveis</span>
            <strong>USD {totalBounties.toLocaleString('pt-BR')}</strong>
          </article>
          <article className={styles.metric}>
            <BrainCircuit size={17} />
            <span>técnicas mapeadas</span>
            <strong>{Math.max(0, techniques.length - 1)}</strong>
          </article>
        </section>

        <div className={styles.tabs} role="tablist" aria-label="Visões do BB-Lab">
          {([
            ['reports', BookOpenCheck, 'reports'],
            ['mentor', BrainCircuit, 'mentor bb'],
            ['practice', FlaskConical, 'trilhas de prática'],
          ] as const).map(([key, Icon, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={view === key}
              onClick={() => setView(key)}
              className={view === key ? styles.tabActive : styles.tab}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {view === 'reports' && (
          <>
            <section className={styles.filters}>
              <div className={styles.searchBox}>
                <Search size={16} />
                <input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setReportsPage(1);
                  }}
                  placeholder="buscar técnica, programa, pesquisador, CWE…"
                  aria-label="Buscar reports"
                />
              </div>
              <div className={styles.selectWrap}>
                <Filter size={14} />
                <select
                  value={severity}
                  onChange={(event) => {
                    setSeverity(event.target.value as typeof severity);
                    setReportsPage(1);
                  }}
                >
                  {SEVERITIES.map((item) => (
                    <option key={item} value={item}>
                      {item === 'Todas' ? item : SEVERITY_PT[item]}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.selectWrap}>
                <select
                  value={technique}
                  onChange={(event) => {
                    setTechnique(event.target.value);
                    setReportsPage(1);
                  }}
                >
                  {techniques.map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>
              <div className={styles.segmented}>
                {([
                  ['all', 'todos'],
                  ['paid', 'pagos'],
                  ['unpaid', 'sem valor'],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setPaid(key);
                      setReportsPage(1);
                    }}
                    className={paid === key ? styles.segmentActive : styles.segment}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

            <div className={styles.resultLine}>
              <span>{filtered.length} reports nesta seleção</span>
              {fetchedAt && <span>sincronizado em {datePt(fetchedAt)}</span>}
            </div>

            {loading && <div className={styles.state}>consultando a Hacktivity…</div>}
            {error && (
              <div className={styles.errorState}>
                <strong>A fonte pública não respondeu agora.</strong>
                <span>{error}</span>
                <button type="button" onClick={() => void loadReports()}>tentar novamente</button>
              </div>
            )}

            {!loading && !error && (
              <section className={styles.reportList}>
                {visibleReports.map((report) => {
                  const open = selectedId === report.id;
                  return (
                    <article key={report.id} className={open ? styles.reportOpen : styles.report}>
                      <button
                        type="button"
                        className={styles.reportSummary}
                        onClick={() => toggleReport(report.id)}
                        aria-expanded={open}
                      >
                        <span className={`${styles.severity} ${styles[`severity_${report.severity}`]}`}>
                          {SEVERITY_PT[report.severity]}
                        </span>
                        <span className={styles.reportMain}>
                          <span className={styles.reportMeta}>
                            {report.program} · @{report.researcher} · {datePt(report.disclosedAt)}
                          </span>
                          <strong>{report.titlePt}</strong>
                          <small>{report.titleOriginal}</small>
                          <span className={styles.chips}>
                            <span>{report.technique}</span>
                            <span>{cwePt(report.cwe)}</span>
                            {report.bounty !== null && report.bounty > 0 && (
                              <span className={styles.paidChip}>{money(report)}</span>
                            )}
                          </span>
                        </span>
                        {open ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                      </button>

                      {open && (
                        <div className={styles.reportDetail}>
                          <div className={styles.detailLead}>
                            <div className={styles.detailLabel}>leitura didática em português</div>
                            <p>{report.summaryPt}</p>
                          </div>
                          <div className={styles.detailGrid}>
                            <section>
                              <h3><Target size={15} /> impacto</h3>
                              <p>{report.impact}</p>
                            </section>
                            <section>
                              <h3><Sparkles size={15} /> bypasses observáveis</h3>
                              <ul>{report.bypasses.map((item) => <li key={item}>{item}</li>)}</ul>
                            </section>
                            <section>
                              <h3><FlaskConical size={15} /> como praticar</h3>
                              <ol>{report.practice.map((item) => <li key={item}>{item}</li>)}</ol>
                            </section>
                            <section>
                              <h3><Lightbulb size={15} /> perguntas de campo</h3>
                              <ul>{report.fieldQuestions.map((item) => <li key={item}>{item}</li>)}</ul>
                            </section>
                          </div>
                          <section className={styles.publicEvidence}>
                            <h3><Code2 size={15} /> evidências e payloads públicos</h3>
                            {detailLoading[report.id] && <p>lendo as atividades públicas do report…</p>}
                            {!detailLoading[report.id] && details[report.id]?.payloads.length > 0 && (
                              <div className={styles.payloadList}>
                                {details[report.id].payloads.map((payload) => (
                                  <div key={`${report.id}-${payload.code}`} className={styles.payload}>
                                    <div className={styles.payloadHead}>
                                      <strong>{payload.label}</strong>
                                      <span>extraído do report</span>
                                    </div>
                                    <pre><code>{payload.code}</code></pre>
                                    <p>{payload.note}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            {!detailLoading[report.id] && details[report.id]?.payloads.length === 0 && (
                              <p>Esse disclosure não expõe payload textual nas atividades públicas. O roteiro didático acima continua disponível.</p>
                            )}
                          </section>
                          <div className={styles.reportFooter}>
                            <span>{money(report)} · {report.votes} votos na Hacktivity</span>
                            <a href={report.url} target="_blank" rel="noreferrer">
                              abrir report original <ArrowUpRight size={14} />
                            </a>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
                {filtered.length === 0 && (
                  <div className={styles.state}>nenhum report combina com esses filtros.</div>
                )}
              </section>
            )}

            {!error && filtered.length > 0 && (
              <>
                <Pagination current={reportsPage} total={reportsPageCount} onChange={setReportsPage} />
                <div className={styles.datasetNote}>
                  {reports.length.toLocaleString('pt-BR')} reports sincronizados de {total.toLocaleString('pt-BR')} disponíveis na fonte
                </div>
              </>
            )}
          </>
        )}

        {view === 'mentor' && <MentorBB reports={reports} loadingReports={loading} />}

        {view === 'practice' && (
          <section className={styles.practice}>
            <div className={styles.sectionIntro}>
              <div>
                <div className={styles.eyebrow}>do report para o próximo alvo</div>
                <h2>Trilhas de prática</h2>
              </div>
              <p>
                Cada trilha converte padrões recorrentes em uma rotina curta: observar, formular
                hipótese, testar com duas identidades e registrar evidência.
              </p>
            </div>
            <div className={styles.practiceGrid}>
              {visiblePracticeGroups.map((group, index) => {
                const reference = group.items[0];
                const absoluteIndex = (practicePage - 1) * TRAILS_PER_PAGE + index;
                return (
                  <article key={group.name} className={styles.practiceCard}>
                    <div className={styles.practiceNumber}>{absoluteIndex + 1}</div>
                    <div>
                      <span>{group.items.length} referências reais</span>
                      <h3>{group.name}</h3>
                      <p>{reference.summaryPt}</p>
                      <div className={styles.practiceSteps}>
                        {reference.practice.map((step) => (
                          <div key={step}><CheckCircle2 size={14} /> {step}</div>
                        ))}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            <Pagination current={practicePage} total={practicePageCount} onChange={setPracticePage} />
          </section>
        )}

        <div className={styles.disclaimer}>
          <strong>Nota de método.</strong> As análises em português são resumos didáticos gerados
          a partir dos metadados públicos; não substituem o conteúdo original nem afirmam detalhes
          que não estejam disponíveis. Teste somente em programas e ativos onde você tem autorização.
          {source && <a href={source} target="_blank" rel="noreferrer"> ver fonte</a>}
        </div>

        <SiteFooter />
      </div>
    </div>
  );
}
