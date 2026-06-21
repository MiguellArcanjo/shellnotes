'use client';

import { ArrowUpRight, BrainCircuit, LoaderCircle, Send, Sparkles } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import type { BBLabReport } from '@/types/bb-lab';
import styles from './BBLab.module.css';

type MentorSource = Pick<BBLabReport, 'id' | 'program' | 'titleOriginal' | 'url' | 'technique'>;

type MentorResponse = {
  answer?: string;
  sources?: MentorSource[];
  error?: string;
  setupRequired?: boolean;
};

const SUGGESTIONS = [
  'Monte um roteiro de caça para Broken Access Control em APIs.',
  'Quais bypasses de validação aparecem com mais frequência?',
  'Como transformar estes reports em uma checklist para uma sessão de 2 horas?',
  'Compare os padrões de XSS e explique como praticá-los em laboratório.',
];

const STOP_WORDS = new Set([
  'a', 'as', 'ao', 'aos', 'com', 'como', 'da', 'das', 'de', 'do', 'dos', 'e',
  'em', 'eu', 'me', 'na', 'nas', 'no', 'nos', 'o', 'os', 'para', 'por', 'que',
  'quais', 'um', 'uma',
]);

function tokens(value: string): string[] {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function selectContext(question: string, reports: BBLabReport[]): BBLabReport[] {
  const queryTokens = tokens(question);
  return reports
    .map((report, index) => {
      const searchable = [
        report.titleOriginal,
        report.titlePt,
        report.summaryPt,
        report.technique,
        report.surface,
        report.impact,
        report.cwe,
        report.program,
        ...report.bypasses,
        ...report.tags,
      ].join(' ');
      const corpus = new Set(tokens(searchable));
      const matches = queryTokens.reduce((score, token) => score + (corpus.has(token) ? 3 : 0), 0);
      const severityBonus = report.severity === 'Critical' ? 1.5 : report.severity === 'High' ? 1 : 0;
      const bountyBonus = report.bounty ? 0.5 : 0;
      return { report, score: matches + severityBonus + bountyBonus - index * 0.0001 };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map(({ report }) => report);
}

export default function MentorBB({
  reports,
  loadingReports,
}: {
  reports: BBLabReport[];
  loadingReports: boolean;
}) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<MentorSource[]>([]);
  const [error, setError] = useState('');
  const [setupRequired, setSetupRequired] = useState(false);
  const [asking, setAsking] = useState(false);

  const contextPreview = useMemo(
    () => question.trim() ? selectContext(question, reports).slice(0, 4) : [],
    [question, reports],
  );

  const ask = async (event?: FormEvent) => {
    event?.preventDefault();
    const normalized = question.trim();
    if (!normalized || reports.length === 0 || asking) return;

    setAsking(true);
    setAnswer('');
    setSources([]);
    setError('');
    setSetupRequired(false);
    try {
      const context = selectContext(normalized, reports);
      const response = await fetch('/api/bb-lab/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: normalized, reports: context }),
      });
      const payload = (await response.json()) as MentorResponse;
      if (!response.ok) {
        setSetupRequired(Boolean(payload.setupRequired));
        throw new Error(payload.error || 'O Mentor BB não conseguiu responder.');
      }
      setAnswer(payload.answer || '');
      setSources(payload.sources || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao consultar o Mentor BB.');
    } finally {
      setAsking(false);
    }
  };

  return (
    <section className={styles.mentor}>
      <div className={styles.mentorIntro}>
        <div>
          <div className={styles.eyebrow}>rag · claude · reports públicos</div>
          <h2>Mentor BB</h2>
          <p>
            Pergunte como um hunter. O mentor encontra os disclosures mais relevantes, cruza os
            padrões e responde citando as fontes usadas.
          </p>
        </div>
        <div className={styles.mentorStatus}>
          <BrainCircuit size={18} />
          <div>
            <strong>{reports.length.toLocaleString('pt-BR')} reports disponíveis</strong>
            <span>A pergunta envia somente os 12 mais relevantes para o Claude.</span>
          </div>
        </div>
      </div>

      <div className={styles.mentorLayout}>
        <div className={styles.mentorWorkspace}>
          <div className={styles.suggestions}>
            {SUGGESTIONS.map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => setQuestion(suggestion)}>
                <Sparkles size={13} />
                {suggestion}
              </button>
            ))}
          </div>

          <form className={styles.mentorForm} onSubmit={ask}>
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ex.: estou testando uma API com duas contas. Que hipóteses de autorização devo priorizar e como registrar as evidências?"
              maxLength={2000}
              disabled={loadingReports}
            />
            <div>
              <span>{question.length}/2000</span>
              <button type="submit" disabled={!question.trim() || asking || loadingReports}>
                {asking ? <LoaderCircle size={15} className={styles.spin} /> : <Send size={15} />}
                {asking ? 'analisando…' : 'perguntar'}
              </button>
            </div>
          </form>

          {contextPreview.length > 0 && !answer && !asking && (
            <div className={styles.contextPreview}>
              <strong>Reports que parecem relevantes</strong>
              <div>
                {contextPreview.map((report) => (
                  <span key={report.id}>{report.program} · {report.technique}</span>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className={styles.mentorError}>
              <strong>{setupRequired ? 'Claude ainda não foi conectado.' : 'Não consegui responder.'}</strong>
              <p>{error}</p>
              {setupRequired && (
                <code>ANTHROPIC_API_KEY=sk-ant-...</code>
              )}
            </div>
          )}

          {answer && (
            <article className={styles.mentorAnswer}>
              <div className={styles.answerLabel}><BrainCircuit size={14} /> resposta fundamentada</div>
              <div className={styles.answerText}>
                {answer.split('\n').map((line, index) => (
                  line ? <p key={`${index}-${line.slice(0, 24)}`}>{line}</p> : <br key={`br-${index}`} />
                ))}
              </div>
            </article>
          )}
        </div>

        <aside className={styles.mentorSources}>
          <div className={styles.eyebrow}>fontes da resposta</div>
          {sources.length === 0 ? (
            <p>As fontes aparecerão aqui depois da primeira pergunta.</p>
          ) : (
            sources.map((source, index) => (
              <a key={source.id} href={source.url} target="_blank" rel="noreferrer">
                <span>{String(index + 1).padStart(2, '0')} · {source.program}</span>
                <strong>{source.titleOriginal}</strong>
                <small>{source.technique}</small>
                <ArrowUpRight size={13} />
              </a>
            ))
          )}
        </aside>
      </div>
    </section>
  );
}
