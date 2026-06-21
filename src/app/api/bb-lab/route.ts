import { enrichHackerOneReport, HACKERONE_QUERY, type HackerOneDocument } from '@/lib/bb-lab';
import type { BBLabResponse } from '@/types/bb-lab';

const SOURCE_URL =
  'https://hackerone.com/hacktivity/overview?queryString=disclosed%3Atrue&sortField=latest_disclosable_activity_at&sortDirection=DESC&pageIndex=0';

type HackerOneResponse = {
  data?: {
    search?: {
      total_count?: number;
      nodes?: HackerOneDocument[];
    };
  };
  errors?: Array<{ message?: string }>;
};

let memoryCache: { expiresAt: number; result: BBLabResponse } | null = null;

async function fetchBatch(from: number, size: number): Promise<HackerOneResponse> {
  const response = await fetch('https://hackerone.com/graphql', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Origin: 'https://hackerone.com',
      Referer: 'https://hackerone.com/hacktivity/overview',
    },
    body: JSON.stringify({
      operationName: 'HacktivitySearchQuery',
      variables: {
        queryString: 'disclosed:true',
        from,
        size,
        sort: {
          field: 'latest_disclosable_activity_at',
          direction: 'DESC',
        },
      },
      query: HACKERONE_QUERY,
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(`HackerOne respondeu com HTTP ${response.status}`);
  }
  return (await response.json()) as HackerOneResponse;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Math.max(0, Number(url.searchParams.get('page')) || 0);
  const pageSize = Math.min(1000, Math.max(100, Number(url.searchParams.get('size')) || 1000));

  if (page === 0 && pageSize === 1000 && memoryCache && memoryCache.expiresAt > Date.now()) {
    return Response.json(memoryCache.result, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400',
        'X-BB-Lab-Cache': 'memory',
      },
    });
  }

  try {
    // HackerOne limits Hacktivity searches to 100 nodes per request.
    // Fetch the requested window in bounded public batches.
    const batchSize = 100;
    const batchCount = Math.ceil(pageSize / batchSize);
    const baseFrom = page * pageSize;
    const payloads: HackerOneResponse[] = [];

    for (let wave = 0; wave < batchCount; wave += 5) {
      const waveRequests = Array.from(
        { length: Math.min(5, batchCount - wave) },
        (_, index) => {
          const batchIndex = wave + index;
          return fetchBatch(baseFrom + batchIndex * batchSize, batchSize);
        },
      );
      payloads.push(...(await Promise.all(waveRequests)));
    }

    const firstError = payloads.flatMap((payload) => payload.errors || [])[0];
    if (firstError) {
      throw new Error(firstError.message || 'Consulta rejeitada pela HackerOne');
    }

    const reports = payloads
      .flatMap((payload) => payload.data?.search?.nodes || [])
      .map(enrichHackerOneReport)
      .filter((report) => report !== null);

    const result: BBLabResponse = {
      reports,
      page,
      pageSize,
      total: payloads[0]?.data?.search?.total_count || reports.length,
      fetchedAt: new Date().toISOString(),
      source: SOURCE_URL,
    };

    if (page === 0 && pageSize === 1000) {
      memoryCache = { expiresAt: Date.now() + 30 * 60 * 1000, result };
    }

    return Response.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Falha ao consultar a Hacktivity',
        source: SOURCE_URL,
      },
      { status: 502 },
    );
  }
}
