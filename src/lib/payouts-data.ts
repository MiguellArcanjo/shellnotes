export type PayoutStatus = 'pendente' | 'pago';

export type Payout = {
  id: string;
  programId: string;
  findingId: string;
  reportId: string;
  amount: number;
  currency: string;
  date: string;
  status: PayoutStatus;
};

export const PAYOUT_STATUSES: PayoutStatus[] = ['pendente', 'pago'];

export const payouts: Payout[] = [
  {
    id: 'payout-xss-perfil',
    programId: 'h1-acme-cloud',
    findingId: 'stored-xss-editor-perfil',
    reportId: 'report-xss-perfil',
    amount: 3200,
    currency: 'US$',
    date: '2026-01-25',
    status: 'pago',
  },
  {
    id: 'payout-oauth-state',
    programId: 'h1-acme-cloud',
    findingId: 'account-takeover-oauth-state',
    reportId: 'report-oauth-state-reuse',
    amount: 9000,
    currency: 'US$',
    date: '2026-04-20',
    status: 'pendente',
  },
  {
    id: 'payout-open-redirect',
    programId: 'ywh-shadow-gateway',
    findingId: 'open-redirect-login',
    reportId: 'report-open-redirect-login',
    amount: 150,
    currency: '€',
    date: '2026-05-10',
    status: 'pago',
  },
  {
    id: 'payout-idor-relatorios',
    programId: 'bc-fintech-web',
    findingId: 'idor-export-relatorios',
    reportId: 'report-idor-relatorios',
    amount: 2400,
    currency: 'US$',
    date: '2026-06-05',
    status: 'pendente',
  },
  {
    id: 'payout-csrf-mfa',
    programId: 'bc-fintech-web',
    findingId: 'csrf-toggle-mfa',
    reportId: '',
    amount: 800,
    currency: 'US$',
    date: '2026-06-12',
    status: 'pendente',
  },
  {
    id: 'payout-legacy-old',
    programId: 'h1-legacy-portal',
    findingId: '',
    reportId: '',
    amount: 1200,
    currency: 'US$',
    date: '2025-11-08',
    status: 'pago',
  },
  {
    id: 'payout-ssrf-webhooks',
    programId: 'int-platform-api',
    findingId: 'ssrf-webhooks',
    reportId: '',
    amount: 4500,
    currency: 'US$',
    date: '2026-02-18',
    status: 'pago',
  },
  {
    id: 'payout-race-cupons',
    programId: 'ywh-shadow-gateway',
    findingId: 'race-condition-cupons',
    reportId: '',
    amount: 600,
    currency: '€',
    date: '2026-06-15',
    status: 'pago',
  },
  {
    id: 'payout-api-key-leak',
    programId: 'h1-orbit-mobile',
    findingId: 'leak-internal-api-key',
    reportId: '',
    amount: 1500,
    currency: 'US$',
    date: '2026-03-30',
    status: 'pago',
  },
  {
    id: 'payout-northstar-misc',
    programId: 'vdp-northstar',
    findingId: '',
    reportId: '',
    amount: 50,
    currency: 'US$',
    date: '2026-06-01',
    status: 'pago',
  },
];

export function getPayout(id: string): Payout | undefined {
  return payouts.find((p) => p.id === id);
}

export function createBlankPayout(id: string): Payout {
  return {
    id,
    programId: '',
    findingId: '',
    reportId: '',
    amount: 0,
    currency: 'US$',
    date: '',
    status: 'pendente',
  };
}

export function formatAmount(amount: number): string {
  return amount.toLocaleString('pt-BR');
}
