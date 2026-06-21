import type { BBLabReport } from '@/types/bb-lab';

type AskBody = {
  question?: string;
  reports?: BBLabReport[];
};

type ClaudeResponse = {
  content?: Array<{ type?: string; text?: string }>;
  error?: { message?: string };
};

function reportContext(report: BBLabReport, index: number): string {
  const payloads = report.payloads
    .slice(0, 3)
    .map((payload) => `${payload.label}: ${payload.code}\nContexto: ${payload.note}`)
    .join('\n');

  return [
    `[FONTE ${index + 1}]`,
    `ID: ${report.id}`,
    `Programa: ${report.program}`,
    `Pesquisador: @${report.researcher}`,
    `Título original: ${report.titleOriginal}`,
    `URL: ${report.url}`,
    `Severidade: ${report.severity}`,
    `CWE: ${report.cwe}`,
    `Técnica: ${report.technique}`,
    `Superfície: ${report.surface}`,
    `Resumo didático: ${report.summaryPt}`,
    `Impacto: ${report.impact}`,
    `Bypasses: ${report.bypasses.join('; ')}`,
    `Prática sugerida: ${report.practice.join('; ')}`,
    payloads ? `Payloads/exemplos disponíveis:\n${payloads}` : '',
  ].filter(Boolean).join('\n');
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error: 'Adicione ANTHROPIC_API_KEY ao arquivo .env.local e reinicie o servidor.',
        setupRequired: true,
      },
      { status: 503 },
    );
  }

  const body = (await request.json()) as AskBody;
  const question = body.question?.trim() || '';
  const reports = Array.isArray(body.reports) ? body.reports.slice(0, 12) : [];

  if (!question || question.length > 2000 || reports.length === 0) {
    return Response.json({ error: 'Pergunta ou contexto inválido.' }, { status: 400 });
  }

  const context = reports.map(reportContext).join('\n\n---\n\n');
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1800,
      cache_control: { type: 'ephemeral' },
      system: [
        {
          type: 'text',
          text: [
            'Você é o Mentor BB do shellnotes, um tutor de bug bounty para um estudante.',
            'Responda sempre em português do Brasil, de forma prática e pedagógica.',
            'Use somente as fontes fornecidas para afirmar fatos sobre reports reais.',
            'Cite fontes no formato [Fonte N] ao lado de cada afirmação factual.',
            'Diferencie claramente: fato do report, inferência e exercício de laboratório.',
            'Para perguntas de caça, entregue hipóteses priorizadas, passos de validação, sinais de sucesso, evidências a coletar e defesas.',
            'Payloads só devem ser explicados para ambientes autorizados e devem vir acompanhados de pré-condições e interpretação.',
            'Se o contexto não sustentar uma resposta, diga isso explicitamente.',
          ].join('\n'),
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `BASE DE REPORTS RECUPERADOS:\n\n${context}`,
              cache_control: { type: 'ephemeral' },
            },
            {
              type: 'text',
              text: `PERGUNTA DO ESTUDANTE:\n${question}`,
            },
          ],
        },
      ],
    }),
    signal: AbortSignal.timeout(60_000),
  });

  const payload = (await response.json()) as ClaudeResponse;
  if (!response.ok) {
    return Response.json(
      { error: payload.error?.message || `Claude respondeu com HTTP ${response.status}.` },
      { status: 502 },
    );
  }

  const answer = (payload.content || [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text || '')
    .join('\n')
    .trim();

  return Response.json({
    answer,
    sources: reports.map(({ id, program, titleOriginal, url, technique }) => ({
      id,
      program,
      titleOriginal,
      url,
      technique,
    })),
  });
}
