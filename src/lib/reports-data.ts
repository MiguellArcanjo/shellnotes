export type ReportStatus = 'submetido' | 'triado' | 'aceito' | 'duplicado' | 'resolvido';

export type TimelineEntry = {
  date: string;
  comment: string;
};

export type Report = {
  id: string;
  title: string;
  programId: string;
  findingId: string;
  submittedAt: string;
  status: ReportStatus;
  bounty: string;
  body: string;
  timeline: TimelineEntry[];
};

export const REPORT_STATUSES: ReportStatus[] = ['submetido', 'triado', 'aceito', 'duplicado', 'resolvido'];

export const reports: Report[] = [
  {
    id: 'report-oauth-state-reuse',
    title: 'Account takeover via OAuth state reuse',
    programId: 'h1-acme-cloud',
    findingId: 'account-takeover-oauth-state',
    submittedAt: '2026-04-10',
    status: 'triado',
    bounty: 'pendente',
    body: [
      '## Passos de reprodução',
      '',
      'Iniciar o fluxo de login social e capturar o parâmetro state emitido pelo servidor.',
      '',
      'Completar o login normalmente e reutilizar o mesmo state em uma segunda janela autenticada como outra vítima.',
      '',
      'Observar que o callback aceita o state reaproveitado e finaliza a sessão na conta da vítima.',
      '',
      '## Impacto',
      '',
      'Um atacante consegue assumir contas de qualquer usuário que tenha iniciado um login social recentemente, sem precisar de credenciais.',
      '',
      '## Remediação',
      '',
      'Invalidar o state após o primeiro uso e vinculá-lo à sessão anônima que o originou, com expiração curta.',
    ].join('\n'),
    timeline: [
      { date: '2026-04-10', comment: 'Report submetido com PoC em vídeo.' },
      { date: '2026-04-13', comment: 'Triador confirmou reprodução e escalou para o time de auth.' },
    ],
  },
  {
    id: 'report-idor-relatorios',
    title: 'IDOR em exportação de relatórios financeiros',
    programId: 'bc-fintech-web',
    findingId: 'idor-export-relatorios',
    submittedAt: '2026-03-22',
    status: 'submetido',
    bounty: '',
    body: [
      '## Passos de reprodução',
      '',
      'Gerar um relatório com a conta de teste A e capturar o endpoint de exportação.',
      '',
      'Trocar o :id pelo identificador de um relatório pertencente à conta de teste B.',
      '',
      'Confirmar que o PDF é gerado e retornado sem validar o dono do recurso.',
      '',
      '## Impacto',
      '',
      'Exposição de dados financeiros sensíveis de outras contas, incluindo saldo e histórico de transações.',
      '',
      '## Remediação',
      '',
      'Validar que o relatório solicitado pertence ao usuário autenticado antes de gerar o export.',
    ].join('\n'),
    timeline: [
      { date: '2026-03-22', comment: 'Report submetido com request/response anexados.' },
    ],
  },
  {
    id: 'report-xss-perfil',
    title: 'Stored XSS no editor de perfil',
    programId: 'h1-acme-cloud',
    findingId: 'stored-xss-editor-perfil',
    submittedAt: '2026-01-05',
    status: 'resolvido',
    bounty: 'US$ 3.200',
    body: [
      '## Passos de reprodução',
      '',
      'Editar o campo "bio" do perfil com um payload de XSS armazenado.',
      '',
      'Salvar o perfil e visitar a página pública do usuário.',
      '',
      'Confirmar a execução do script no contexto de qualquer visitante.',
      '',
      '## Impacto',
      '',
      'Roubo de sessão de qualquer visitante do perfil público, incluindo administradores.',
      '',
      '## Remediação',
      '',
      'Sanitizar e escapar o campo "bio" na renderização, e aplicar uma Content-Security-Policy restritiva.',
    ].join('\n'),
    timeline: [
      { date: '2026-01-05', comment: 'Report submetido.' },
      { date: '2026-01-08', comment: 'Triador reproduziu e classificou como alto.' },
      { date: '2026-01-20', comment: 'Correção publicada em produção. Bounty aprovado.' },
      { date: '2026-01-25', comment: 'Pagamento de US$ 3.200 efetuado.' },
    ],
  },
  {
    id: 'report-cors-perfil',
    title: 'CORS permissivo expõe dados de perfil',
    programId: 'h1-orbit-mobile',
    findingId: 'cors-permissivo-perfil',
    submittedAt: '2026-02-14',
    status: 'duplicado',
    bounty: '',
    body: [
      '## Passos de reprodução',
      '',
      'Enviar uma requisição para /v1/me com o header Origin apontando para um domínio arbitrário.',
      '',
      'Verificar que o servidor reflete o Origin em Access-Control-Allow-Origin com Allow-Credentials: true.',
      '',
      '## Impacto',
      '',
      'Qualquer site malicioso visitado pela vítima logada consegue ler nome, e-mail e telefone do perfil.',
      '',
      '## Remediação',
      '',
      'Restringir Access-Control-Allow-Origin a uma allowlist de domínios confiáveis.',
    ].join('\n'),
    timeline: [
      { date: '2026-02-14', comment: 'Report submetido.' },
      { date: '2026-02-16', comment: 'Marcado como duplicado do report #4821, já em correção.' },
    ],
  },
  {
    id: 'report-open-redirect-login',
    title: 'Open redirect no parâmetro de retorno do login',
    programId: 'ywh-shadow-gateway',
    findingId: 'open-redirect-login',
    submittedAt: '2026-05-02',
    status: 'aceito',
    bounty: '€ 150',
    body: [
      '## Passos de reprodução',
      '',
      'Acessar /login?return=https://atacante.example.',
      '',
      'Completar o login normalmente.',
      '',
      'Confirmar que o usuário é redirecionado para o domínio externo após autenticar.',
      '',
      '## Impacto',
      '',
      'Pode ser usado em campanhas de phishing que abusam do domínio legítimo para redirecionar a um site malicioso após o login.',
      '',
      '## Remediação',
      '',
      'Validar o parâmetro return contra uma allowlist de paths internos, ou remover o redirecionamento externo.',
    ].join('\n'),
    timeline: [
      { date: '2026-05-02', comment: 'Report submetido.' },
      { date: '2026-05-05', comment: 'Triador aceitou como severidade baixa e aprovou o bounty mínimo da tabela.' },
    ],
  },
  {
    id: 'report-enumeracao-convites',
    title: 'Enumeração de usuários no fluxo de convite',
    programId: 'vdp-northstar',
    findingId: 'enumeracao-convites',
    submittedAt: '2025-12-02',
    status: 'resolvido',
    bounty: 'reconhecimento público',
    body: [
      '## Passos de reprodução',
      '',
      'Submeter e-mails conhecidos e desconhecidos no formulário de convite.',
      '',
      'Comparar o tempo de resposta e a mensagem de erro retornada para cada caso.',
      '',
      '## Impacto',
      '',
      'Permite confirmar quais e-mails possuem conta, útil para campanhas de phishing direcionadas.',
      '',
      '## Remediação',
      '',
      'Padronizar a mensagem e o tempo de resposta independentemente de o e-mail já estar cadastrado.',
    ].join('\n'),
    timeline: [
      { date: '2025-12-02', comment: 'Report submetido via VDP.' },
      { date: '2025-12-10', comment: 'Confirmado e adicionado ao hall of fame.' },
    ],
  },
];

export function getReport(id: string): Report | undefined {
  return reports.find((r) => r.id === id);
}

export function createBlankReport(id: string): Report {
  return {
    id,
    title: '',
    programId: '',
    findingId: '',
    submittedAt: '',
    status: 'submetido',
    bounty: '',
    body: '',
    timeline: [],
  };
}
