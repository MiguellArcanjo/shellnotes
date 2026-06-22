// Client helpers that turn the existing Mentor pipeline (Next.js /api/bb-lab/ask
// -> HMAC -> droplet /v1/ask -> Claude) into a per-lab tutor: progressive hints,
// open-ended grading and post-solve explanations. No droplet changes required —
// we just shape the `question` and pass relevant real reports as grounding.

import type { BBLabReport } from '@/types/bb-lab';

export type MentorReply = {
  ok: boolean;
  text: string;
  setupRequired?: boolean;
};

export type Verdict = 'SUCESSO' | 'PARCIAL' | 'ERRADO' | 'INDEFINIDO';
export type MentorGrade = MentorReply & { verdict: Verdict };

const QUESTION_LIMIT = 1900;

function clamp(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

async function callMentor(question: string, reports: BBLabReport[]): Promise<MentorReply> {
  const context = reports.slice(0, 12);
  if (context.length === 0) {
    return { ok: false, text: 'Carregue os reports (aba reports) para ativar o mentor neste lab.' };
  }
  try {
    const response = await fetch('/api/bb-lab/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: clamp(question, QUESTION_LIMIT), reports: context }),
    });
    const payload = (await response.json()) as { answer?: string; error?: string; setupRequired?: boolean };
    if (!response.ok) {
      return {
        ok: false,
        text: payload.error || 'O mentor não conseguiu responder agora.',
        setupRequired: Boolean(payload.setupRequired),
      };
    }
    return { ok: true, text: (payload.answer || '').trim() };
  } catch {
    return { ok: false, text: 'Falha de rede ao consultar o mentor.' };
  }
}

type LabContext = {
  moduleTitle: string;
  technique: string;
  labTitle: string;
  scenario: string;
  goal: string;
  attempt: string;
};

export async function mentorHint(ctx: LabContext, reports: BBLabReport[]): Promise<MentorReply> {
  const question = [
    `Você é um tutor de segurança ofensiva guiando um INICIANTE num laboratório controlado e autorizado.`,
    `Tópico: ${ctx.technique}. Lab: "${ctx.labTitle}". Cenário: ${ctx.scenario}`,
    `Objetivo do aluno: ${ctx.goal}`,
    `Tentativa atual dele:\n${clamp(ctx.attempt, 600)}`,
    `Dê APENAS a próxima dica (1-3 frases), do método socrático: aponte o que observar ou o próximo micro-passo. NÃO entregue o payload final pronto. Responda em português.`,
  ].join('\n\n');
  return callMentor(question, reports);
}

export async function mentorGrade(ctx: LabContext, reports: BBLabReport[]): Promise<MentorGrade> {
  const question = [
    `Você é um avaliador de um laboratório de segurança controlado e autorizado, ensinando um INICIANTE.`,
    `Tópico: ${ctx.technique}. Lab: "${ctx.labTitle}". Cenário: ${ctx.scenario}`,
    `Objetivo: ${ctx.goal}`,
    `Solução enviada pelo aluno:\n${clamp(ctx.attempt, 800)}`,
    `Avalie se a solução realmente explora a falha e atinge o objetivo.`,
    `Comece OBRIGATORIAMENTE a resposta com uma destas linhas exatas: "VEREDITO: SUCESSO", "VEREDITO: PARCIAL" ou "VEREDITO: ERRADO".`,
    `Depois explique em 2-4 frases o porquê e, se não for sucesso, qual o próximo ajuste. Responda em português.`,
  ].join('\n\n');
  const reply = await callMentor(question, reports);
  let verdict: Verdict = 'INDEFINIDO';
  const match = reply.text.match(/VEREDITO:\s*(SUCESSO|PARCIAL|ERRADO)/i);
  if (match) verdict = match[1].toUpperCase() as Verdict;
  const text = reply.text.replace(/^VEREDITO:\s*(SUCESSO|PARCIAL|ERRADO)\s*/i, '').trim();
  return { ...reply, verdict, text: text || reply.text };
}

export async function mentorExplain(ctx: Omit<LabContext, 'attempt'>, reports: BBLabReport[]): Promise<MentorReply> {
  const question = [
    `Você é um mentor de segurança explicando para um INICIANTE que acabou de resolver um lab.`,
    `Tópico: ${ctx.technique}. Lab: "${ctx.labTitle}".`,
    `Objetivo alcançado: ${ctx.goal}`,
    `Explique em 3-5 frases: por que essa falha existe no mundo real, qual o impacto típico num programa de bug bounty, e como o desenvolvedor deveria corrigir. Cite um dos reports do contexto se for relevante. Responda em português.`,
  ].join('\n\n');
  return callMentor(question, reports);
}
