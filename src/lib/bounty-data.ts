export type Platform = 'HackerOne' | 'Intigriti' | 'Bugcrowd' | 'YesWeHack' | 'Próprio';
export type ProgramStatus = 'caçando' | 'pausado' | 'arquivado';
export type ProgramType = 'VDP' | 'pago';
export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type RewardTier = {
  severity: Severity;
  range: string;
};

export type Program = {
  id: string;
  platform: Platform;
  name: string;
  url: string;
  status: ProgramStatus;
  type: ProgramType;
  rewardRange: string;
  scopeIn: string[];
  scopeOut: string[];
  rules: string;
  rewardTable: RewardTier[];
  lastPolicyReview: string;
};

export const PLATFORMS: Platform[] = ['HackerOne', 'Intigriti', 'Bugcrowd', 'YesWeHack', 'Próprio'];
export const STATUSES: ProgramStatus[] = ['caçando', 'pausado', 'arquivado'];
export const TYPES: ProgramType[] = ['VDP', 'pago'];
export const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low'];

export const SEVERITY_LABELS: Record<Severity, string> = {
  critical: 'crítico',
  high: 'alto',
  medium: 'médio',
  low: 'baixo',
};

function blankRewardTable(): RewardTier[] {
  return SEVERITY_ORDER.map((severity) => ({ severity, range: '' }));
}

export const programs: Program[] = [
  {
    id: 'h1-acme-cloud',
    platform: 'HackerOne',
    name: 'Acme Cloud',
    url: 'https://hackerone.com/acme-cloud',
    status: 'caçando',
    type: 'pago',
    rewardRange: 'US$ 100 – 15.000',
    scopeIn: ['*.acme-cloud.com', 'api.acme-cloud.com', 'admin.acme-cloud.com', 'app.acme-cloud.com (iOS/Android)'],
    scopeOut: ['*.staging.acme-cloud.com', 'status.acme-cloud.com', 'blog.acme-cloud.com'],
    rules: 'Sem DoS, sem engenharia social, sem testes em dados reais de clientes. Rate limit: máx. 10 req/s; scanners automatizados precisam de aviso prévio por e-mail.',
    rewardTable: [
      { severity: 'critical', range: 'US$ 8.000 – 15.000' },
      { severity: 'high', range: 'US$ 2.000 – 8.000' },
      { severity: 'medium', range: 'US$ 500 – 2.000' },
      { severity: 'low', range: 'US$ 100 – 500' },
    ],
    lastPolicyReview: '2026-04-02',
  },
  {
    id: 'bc-fintech-web',
    platform: 'Bugcrowd',
    name: 'Fintech Web',
    url: 'https://bugcrowd.com/fintech-web',
    status: 'caçando',
    type: 'pago',
    rewardRange: 'US$ 250 – 10.000',
    scopeIn: ['app.fintech.com', 'api.fintech.com/v2/*', '*.fintech.com'],
    scopeOut: ['marketing.fintech.com', 'partners.fintech.com'],
    rules: 'Usar apenas as contas de teste fornecidas, nunca dados reais de clientes. Rate limit: 5 req/s. Proibido testar engenharia social contra funcionários.',
    rewardTable: [
      { severity: 'critical', range: 'US$ 5.000 – 10.000' },
      { severity: 'high', range: 'US$ 1.500 – 5.000' },
      { severity: 'medium', range: 'US$ 400 – 1.500' },
      { severity: 'low', range: 'US$ 250 – 400' },
    ],
    lastPolicyReview: '2026-03-18',
  },
  {
    id: 'h1-orbit-mobile',
    platform: 'HackerOne',
    name: 'Orbit Mobile',
    url: 'https://hackerone.com/orbit-mobile',
    status: 'caçando',
    type: 'pago',
    rewardRange: 'US$ 150 – 12.000',
    scopeIn: ['com.orbit.mobile (Android)', 'com.orbit.mobile (iOS)', 'api.orbit.app'],
    scopeOut: ['build interno (TestFlight fechado)'],
    rules: 'Engenharia reversa permitida apenas no binário público da loja. Sem testes em contas de terceiros sem autorização.',
    rewardTable: [
      { severity: 'critical', range: 'US$ 6.000 – 12.000' },
      { severity: 'high', range: 'US$ 1.800 – 6.000' },
      { severity: 'medium', range: 'US$ 450 – 1.800' },
      { severity: 'low', range: 'US$ 150 – 450' },
    ],
    lastPolicyReview: '2026-05-01',
  },
  {
    id: 'int-platform-api',
    platform: 'Intigriti',
    name: 'Platform API',
    url: 'https://app.intigriti.com/programs/platform-api',
    status: 'pausado',
    type: 'pago',
    rewardRange: 'US$ 200 – 9.000',
    scopeIn: ['api.platform.io', 'webhooks.platform.io'],
    scopeOut: ['sandbox.platform.io'],
    rules: 'Programa pausado para revisão de escopo — não submeter novos reports até reabertura. Rate limit anterior: 8 req/s.',
    rewardTable: [
      { severity: 'critical', range: 'US$ 4.500 – 9.000' },
      { severity: 'high', range: 'US$ 1.200 – 4.500' },
      { severity: 'medium', range: 'US$ 400 – 1.200' },
      { severity: 'low', range: 'US$ 200 – 400' },
    ],
    lastPolicyReview: '2026-02-10',
  },
  {
    id: 'ywh-shadow-gateway',
    platform: 'YesWeHack',
    name: 'Shadow API Gateway',
    url: 'https://yeswehack.com/programs/shadow-gateway',
    status: 'caçando',
    type: 'pago',
    rewardRange: '€ 150 – 8.000',
    scopeIn: ['gateway.shadow.io', 'gateway-eu.shadow.io'],
    scopeOut: ['internal.shadow.io'],
    rules: 'Sem fuzzing agressivo fora da janela de manutenção (terças, 02h–04h UTC). Rate limit: 6 req/s.',
    rewardTable: [
      { severity: 'critical', range: '€ 4.000 – 8.000' },
      { severity: 'high', range: '€ 1.200 – 4.000' },
      { severity: 'medium', range: '€ 350 – 1.200' },
      { severity: 'low', range: '€ 150 – 350' },
    ],
    lastPolicyReview: '2026-01-15',
  },
  {
    id: 'vdp-northstar',
    platform: 'Próprio',
    name: 'Northstar VDP',
    url: 'https://northstar.dev/security',
    status: 'caçando',
    type: 'VDP',
    rewardRange: 'sem recompensa monetária — reconhecimento público',
    scopeIn: ['*.northstar.dev', 'northstar.dev'],
    scopeOut: ['status.northstar.dev'],
    rules: 'Disclosure responsável, 90 dias para correção antes de publicação. Sem rate limit definido — manter tráfego razoável.',
    rewardTable: [
      { severity: 'critical', range: 'reconhecimento público + hall of fame' },
      { severity: 'high', range: 'reconhecimento público' },
      { severity: 'medium', range: 'menção no hall of fame' },
      { severity: 'low', range: 'agradecimento por e-mail' },
    ],
    lastPolicyReview: '2025-12-20',
  },
  {
    id: 'h1-legacy-portal',
    platform: 'HackerOne',
    name: 'Legacy Portal',
    url: 'https://hackerone.com/legacy-portal',
    status: 'arquivado',
    type: 'pago',
    rewardRange: 'programa encerrado',
    scopeIn: [],
    scopeOut: ['* (escopo removido após encerramento)'],
    rules: 'Programa encerrado em 2025. Não submeter novos reports — sem triagem ativa.',
    rewardTable: blankRewardTable(),
    lastPolicyReview: '2025-08-01',
  },
];

export function getProgram(id: string): Program | undefined {
  return programs.find((p) => p.id === id);
}

export function createBlankProgram(id: string): Program {
  return {
    id,
    platform: 'HackerOne',
    name: '',
    url: '',
    status: 'caçando',
    type: 'pago',
    rewardRange: '',
    scopeIn: [],
    scopeOut: [],
    rules: '',
    rewardTable: blankRewardTable(),
    lastPolicyReview: '',
  };
}
