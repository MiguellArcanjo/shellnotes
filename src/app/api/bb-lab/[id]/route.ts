import type { BBLabPayload, BBLabPublicDetail } from '@/types/bb-lab';

type ActivityEdge = {
  node?: {
    __typename?: string;
    message?: string | null;
  } | null;
};

type DetailResponse = {
  data?: {
    reports?: {
      nodes?: Array<{
        activities?: { edges?: ActivityEdge[] };
      }>;
    };
  };
};

const DETAIL_QUERY = `
  query PublicReportDetail($id: Int!) {
    reports(where: { id: { _eq: $id } }) {
      nodes {
        id
        activities(
          first: 100
          order_by: { field: created_at, direction: ASC }
        ) {
          edges {
            node {
              __typename
              ... on ReportActivityInterface {
                id
                message
              }
            }
          }
        }
      }
    }
  }
`;

function decodeHtml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .trim();
}

function extractMetaDescription(html: string): string {
  const match =
    /<meta\s+(?:name|property)=["'](?:description|og:description)["']\s+content=["']([\s\S]*?)["']\s*\/?>/i.exec(html) ||
    /<meta\s+content=["']([\s\S]*?)["']\s+(?:name|property)=["'](?:description|og:description)["'][^>]*>/i.exec(html);
  return match ? decodeHtml(match[1]) : '';
}

function extractPayloads(messages: string[]): BBLabPayload[] {
  const payloads: BBLabPayload[] = [];
  const seen = new Set<string>();

  const add = (label: string, code: string, note: string) => {
    const normalized = code.trim();
    if (!normalized || normalized.length > 1800 || seen.has(normalized)) return;
    seen.add(normalized);
    payloads.push({
      label,
      code: normalized,
      note,
      source: 'report-publico',
    });
  };

  for (const message of messages) {
    for (const match of message.matchAll(/```([a-z0-9_-]*)\n([\s\S]*?)```/gi)) {
      add(
        match[1] ? `Bloco ${match[1]} publicado` : 'Bloco publicado',
        match[2],
        'Trecho técnico extraído de uma atividade pública do report.',
      );
    }

    for (const match of message.matchAll(/`([^`\n]{4,500})`/g)) {
      add('Trecho inline publicado', match[1], 'Valor citado publicamente pelo pesquisador ou pelo programa.');
    }

    for (const line of message.split('\n')) {
      const trimmed = line.trim();
      if (
        /^(GET|POST|PUT|PATCH|DELETE|OPTIONS)\s+\S+/i.test(trimmed) ||
        /^(curl|wget|python|node|ruby|php)\s+/i.test(trimmed) ||
        /^https?:\/\/\S+/i.test(trimmed)
      ) {
        add('Requisição ou comando publicado', trimmed, 'Linha técnica presente na discussão pública do report.');
      }
    }
  }

  return payloads.slice(0, 16);
}

function extractTechnicalNotes(messages: string[]): string[] {
  return messages
    .filter((message) =>
      /(bypass|payload|regex|before:|after:|fixed|exploit|request|response|token|authenticated|validation)/i.test(message),
    )
    .map((message) => message.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((message) => message.slice(0, 700));
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const reportId = Number(id);
  if (!Number.isInteger(reportId) || reportId <= 0) {
    return Response.json({ error: 'Report inválido.' }, { status: 400 });
  }

  try {
    const reportUrl = `https://hackerone.com/reports/${reportId}`;
    const [graphqlResponse, pageResponse] = await Promise.all([
      fetch('https://hackerone.com/graphql', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Origin: 'https://hackerone.com',
          Referer: reportUrl,
        },
        body: JSON.stringify({
          operationName: 'PublicReportDetail',
          variables: { id: reportId },
          query: DETAIL_QUERY,
        }),
        signal: AbortSignal.timeout(15_000),
      }),
      fetch(reportUrl, {
        headers: { Accept: 'text/html' },
        signal: AbortSignal.timeout(15_000),
      }),
    ]);

    if (!graphqlResponse.ok || !pageResponse.ok) {
      throw new Error('A HackerOne não retornou o detalhe público.');
    }

    const graph = (await graphqlResponse.json()) as DetailResponse;
    const html = await pageResponse.text();
    const summaryOriginal = extractMetaDescription(html);
    const messages = (graph.data?.reports?.nodes?.[0]?.activities?.edges || [])
      .map((edge) => edge.node?.message?.trim())
      .filter((message): message is string => Boolean(message));
    const publicText = summaryOriginal ? [summaryOriginal, ...messages] : messages;

    const detail: BBLabPublicDetail = {
      reportId: String(reportId),
      summaryOriginal,
      payloads: extractPayloads(publicText),
      technicalNotes: extractTechnicalNotes(publicText),
      fetchedAt: new Date().toISOString(),
    };

    return Response.json(detail, {
      headers: {
        'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=604800',
      },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Falha ao carregar o detalhe público.' },
      { status: 502 },
    );
  }
}
