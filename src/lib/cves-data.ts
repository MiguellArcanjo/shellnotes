export type CveSeverity = 'low' | 'medium' | 'high' | 'critical';
export type CveStatus = 'draft' | 'published';
export type ExploitStatus = 'não explorada' | 'PoC público' | 'exploração ativa' | 'corrigida';

export type CveCodeBlock = {
  title: string;
  language: string;
  code: string;
};

export type CveEntry = {
  id: string;
  cveId: string;
  cvss: number;
  severity: CveSeverity;
  product: string;
  version: string;
  vulnerabilityType: string;
  description: string;
  impact: string;
  reproduction: string;
  mitigation: string;
  notes: string;
  reproduced: boolean;
  pocUrl: string;
  exploitStatus: ExploitStatus;
  writeupSlug: string;
  references: string[];
  codeBlocks: CveCodeBlock[];
  status: CveStatus;
  createdAt: string;
  updatedAt: string;
};

export const CVE_TYPES = ['RCE', 'XSS', 'SQLi', 'SSRF', 'LPE', 'IDOR', 'DoS', 'Auth bypass', 'Info leak'];
export const EXPLOIT_STATUSES: ExploitStatus[] = ['não explorada', 'PoC público', 'exploração ativa', 'corrigida'];

export function severityFromScore(score: number): CveSeverity {
  if (score >= 9) return 'critical';
  if (score >= 7) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

export const cveEntries: CveEntry[] = [
  {
    id: 'cve-2024-3094',
    cveId: 'CVE-2024-3094',
    cvss: 10,
    severity: 'critical',
    product: 'XZ Utils',
    version: '5.6.0–5.6.1',
    vulnerabilityType: 'RCE',
    description: 'Backdoor introduzido na cadeia de build do liblzma, afetando autenticação SSH em sistemas específicos.',
    impact: 'Em ambientes afetados, a cadeia adulterada pode interferir na autenticação SSH e permitir execução remota de código antes da autenticação.',
    reproduction: 'Confirmar a versão do pacote, identificar a origem do build e comparar o binário liblzma com pacotes conhecidos como íntegros. A análise deve ocorrer em laboratório isolado.',
    mitigation: 'Rebaixar imediatamente para uma versão anterior a 5.6.0, substituir pacotes comprometidos e revisar logs e chaves dos hosts expostos.',
    notes: 'Revisar indicadores de comprometimento e versões empacotadas nas distribuições de teste.',
    reproduced: true,
    pocUrl: 'https://www.openwall.com/lists/oss-security/2024/03/29/4',
    exploitStatus: 'PoC público',
    writeupSlug: '',
    references: ['https://www.openwall.com/lists/oss-security/2024/03/29/4'],
    codeBlocks: [
      { title: 'verificar versão instalada', language: 'bash', code: 'xz --version\nldd $(which sshd) | grep liblzma' },
    ],
    status: 'published',
    createdAt: '2024-03-29',
    updatedAt: '2026-06-12',
  },
  {
    id: 'cve-2021-44228',
    cveId: 'CVE-2021-44228',
    cvss: 10,
    severity: 'critical',
    product: 'Apache Log4j',
    version: '2.0-beta9–2.14.1',
    vulnerabilityType: 'RCE',
    description: 'Injeção JNDI permite execução remota de código por meio de mensagens controladas pelo atacante.',
    impact: 'Um atacante remoto pode executar código no contexto da aplicação vulnerável quando uma string controlada é processada pelo Log4j.',
    reproduction: 'Executar somente em ambiente isolado: iniciar um serviço vulnerável, apontar o lookup para infraestrutura de laboratório e observar a resolução JNDI.',
    mitigation: 'Atualizar o Log4j para uma versão corrigida, remover JndiLookup de versões legadas e bloquear saídas LDAP/RMI desnecessárias.',
    notes: 'Ambiente de laboratório reproduzido com LDAP de teste isolado.',
    reproduced: true,
    pocUrl: '',
    exploitStatus: 'exploração ativa',
    writeupSlug: '',
    references: ['https://logging.apache.org/log4j/2.x/security.html'],
    codeBlocks: [
      { title: 'payload de detecção', language: 'text', code: '${jndi:ldap://127.0.0.1:1389/a}' },
      { title: 'localizar dependências', language: 'bash', code: 'find / -type f -name "log4j-core-*.jar" 2>/dev/null' },
    ],
    status: 'published',
    createdAt: '2021-12-10',
    updatedAt: '2026-05-28',
  },
  {
    id: 'cve-2025-32433',
    cveId: 'CVE-2025-32433',
    cvss: 10,
    severity: 'critical',
    product: 'Erlang/OTP SSH',
    version: 'OTP-27.3.2 e anteriores',
    vulnerabilityType: 'Auth bypass',
    description: 'Execução de comandos sem autenticação no servidor SSH do Erlang/OTP.',
    impact: 'Pode permitir execução arbitrária de comandos antes da autenticação em serviços SSH implementados com versões vulneráveis do Erlang/OTP.',
    reproduction: '',
    mitigation: 'Atualizar para a versão corrigida do Erlang/OTP e restringir a exposição do serviço SSH até a correção.',
    notes: 'Aguardando finalizar a matriz de versões afetadas no laboratório.',
    reproduced: false,
    pocUrl: '',
    exploitStatus: 'PoC público',
    writeupSlug: '',
    references: [],
    codeBlocks: [],
    status: 'draft',
    createdAt: '2025-04-16',
    updatedAt: '2026-06-17',
  },
  {
    id: 'cve-2023-4966',
    cveId: 'CVE-2023-4966',
    cvss: 9.4,
    severity: 'critical',
    product: 'Citrix NetScaler ADC',
    version: '12.1–13.1',
    vulnerabilityType: 'Info leak',
    description: 'Divulgação de memória sensível permite recuperar tokens de sessão válidos.',
    impact: 'Tokens de sessão expostos podem permitir sequestro de sessões autenticadas e acesso não autorizado a aplicações publicadas.',
    reproduction: '',
    mitigation: 'Aplicar as correções do fabricante, encerrar todas as sessões existentes e rotacionar credenciais potencialmente expostas.',
    notes: 'Relacionar com técnicas de reutilização de sessão e recomendações de rotação.',
    reproduced: false,
    pocUrl: '',
    exploitStatus: 'exploração ativa',
    writeupSlug: '',
    references: [],
    codeBlocks: [],
    status: 'published',
    createdAt: '2023-10-10',
    updatedAt: '2026-04-03',
  },
  {
    id: 'cve-2024-6387',
    cveId: 'CVE-2024-6387',
    cvss: 8.1,
    severity: 'high',
    product: 'OpenSSH',
    version: '8.5p1–9.7p1',
    vulnerabilityType: 'RCE',
    description: 'Race condition no signal handler do servidor OpenSSH em sistemas glibc.',
    impact: 'Em condições específicas, a corrida pode resultar em execução remota de código sem autenticação.',
    reproduction: 'A reprodução depende de arquitetura, versão da glibc e grande número de tentativas; realizar apenas em laboratório descartável.',
    mitigation: 'Atualizar o OpenSSH para uma versão corrigida ou aplicar a mitigação temporária recomendada pelo fornecedor.',
    notes: 'Reprodução instável; documentar requisitos de timing e arquitetura.',
    reproduced: false,
    pocUrl: '',
    exploitStatus: 'PoC público',
    writeupSlug: '',
    references: [],
    codeBlocks: [],
    status: 'draft',
    createdAt: '2024-07-01',
    updatedAt: '2026-06-01',
  },
];

export function createBlankCve(id: string): CveEntry {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id,
    cveId: '',
    cvss: 0,
    severity: 'low',
    product: '',
    version: '',
    vulnerabilityType: 'RCE',
    description: '',
    impact: '',
    reproduction: '',
    mitigation: '',
    notes: '',
    reproduced: false,
    pocUrl: '',
    exploitStatus: 'não explorada',
    writeupSlug: '',
    references: [],
    codeBlocks: [],
    status: 'draft',
    createdAt: today,
    updatedAt: today,
  };
}
