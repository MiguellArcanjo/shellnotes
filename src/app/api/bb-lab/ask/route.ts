import { createHmac, randomUUID } from 'node:crypto';
import type { BBLabReport } from '@/types/bb-lab';

export const runtime = 'nodejs';
export const maxDuration = 120;

type AskBody = {
  question?: string;
  reports?: BBLabReport[];
};

type MentorError = {
  error?: string;
  code?: string;
};

function configuration() {
  const url = process.env.SHELLNOTES_MENTOR_URL?.replace(/\/+$/, '');
  const secret = process.env.SHELLNOTES_MENTOR_SECRET;
  return { url, secret };
}

function validBody(body: AskBody): body is Required<AskBody> {
  return Boolean(
    body.question?.trim()
    && body.question.length <= 2000
    && Array.isArray(body.reports)
    && body.reports.length > 0
    && body.reports.length <= 12,
  );
}

export async function POST(request: Request) {
  const { url, secret } = configuration();
  if (!url || !secret) {
    return Response.json(
      {
        error: 'O servidor privado do Mentor BB ainda não foi conectado.',
        setupRequired: true,
      },
      { status: 503 },
    );
  }

  let body: AskBody;
  try {
    body = (await request.json()) as AskBody;
  } catch {
    return Response.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  if (!validBody(body)) {
    return Response.json({ error: 'Pergunta ou contexto inválido.' }, { status: 400 });
  }

  const payload = JSON.stringify({
    question: body.question.trim(),
    reports: body.reports,
  });
  const timestamp = Date.now().toString();
  const requestId = randomUUID();
  const signature = createHmac('sha256', secret)
    .update(`${timestamp}.${requestId}.${payload}`)
    .digest('hex');

  try {
    const response = await fetch(`${url}/v1/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shellnotes-Timestamp': timestamp,
        'X-Shellnotes-Request-Id': requestId,
        'X-Shellnotes-Signature': signature,
      },
      body: payload,
      cache: 'no-store',
      signal: AbortSignal.timeout(105_000),
    });

    const text = await response.text();
    let mentorPayload: MentorError & Record<string, unknown>;
    try {
      mentorPayload = JSON.parse(text) as MentorError & Record<string, unknown>;
    } catch {
      mentorPayload = { error: 'O servidor do Mentor retornou uma resposta inválida.' };
    }

    return Response.json(mentorPayload, {
      status: response.status,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (cause) {
    const timedOut = cause instanceof Error && cause.name === 'TimeoutError';
    return Response.json(
      {
        error: timedOut
          ? 'O Mentor demorou mais que o esperado. Tente novamente em instantes.'
          : 'Não foi possível alcançar o servidor privado do Mentor.',
        code: timedOut ? 'MENTOR_TIMEOUT' : 'MENTOR_UNAVAILABLE',
      },
      { status: 502 },
    );
  }
}
