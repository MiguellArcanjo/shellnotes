import { createHmac, randomUUID } from 'node:crypto';

// Reuses the same private-mentor pipeline as the BB-Lab Mentor (HMAC-signed call
// to the droplet's /v1/ask running Claude), but for TryHackMe assistance:
// generating a clean writeup from room notes, or suggesting the next step from
// command output. No reports are involved here — just the room context.

export const runtime = 'nodejs';
export const maxDuration = 120;

type AssistBody = {
  prompt?: string;
};

function configuration() {
  const url = process.env.SHELLNOTES_MENTOR_URL?.replace(/\/+$/, '');
  const secret = process.env.SHELLNOTES_MENTOR_SECRET;
  return { url, secret };
}

export async function POST(request: Request) {
  const { url, secret } = configuration();
  if (!url || !secret) {
    return Response.json(
      { error: 'O assistente de IA (Claude no droplet) ainda não foi conectado.', setupRequired: true },
      { status: 503 },
    );
  }

  let body: AssistBody;
  try {
    body = (await request.json()) as AssistBody;
  } catch {
    return Response.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  const prompt = body.prompt?.trim();
  if (!prompt || prompt.length > 16_000) {
    return Response.json({ error: 'Prompt ausente ou muito longo.' }, { status: 400 });
  }

  const payload = JSON.stringify({ question: prompt, reports: [] });
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
    let mentorPayload: Record<string, unknown>;
    try {
      mentorPayload = JSON.parse(text) as Record<string, unknown>;
    } catch {
      mentorPayload = { error: 'O assistente retornou uma resposta inválida.' };
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
          ? 'O assistente demorou mais que o esperado. Tente novamente.'
          : 'Não foi possível alcançar o assistente de IA.',
      },
      { status: 502 },
    );
  }
}
