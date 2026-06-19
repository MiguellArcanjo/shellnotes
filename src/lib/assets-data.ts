export type AssetType =
  | 'domínio'
  | 'subdomínio'
  | 'IP'
  | 'CIDR'
  | 'URL'
  | 'endpoint de API'
  | 'app mobile'
  | 'repositório'
  | 'bucket'
  | 'wildcard';

export type DiscoverySource = 'subfinder' | 'amass' | 'crt.sh' | 'ASN' | 'dork' | 'GitHub' | 'Shodan' | 'manual' | 'outro';

export type ResolveStatus = 'vivo' | 'morto' | 'não verificado';

// Status and priority used to be closed unions; they are now taxonomy ids
// (see lib/assetTaxonomy.ts) so users can rename/recolor/add values. The
// aliases stay so existing imports keep working.
export type AssetStatus = string;

export type Priority = string;

export type SectionKey = 'identificacao' | 'rede' | 'fingerprint' | 'superficie' | 'triagem';

export type CustomField = {
  id: string;
  section: SectionKey;
  label: string;
  value: string;
};

export type ObservationEntry = {
  id: string;
  text: string;
  at: string; // ISO datetime
};

export type AssetAttachment = {
  id: string;
  name: string;
  path: string;
  size: number;
  uploadedAt: string; // ISO datetime
};

export type Asset = {
  id: string;

  // Identificação
  type: AssetType;
  host: string;
  programId: string;
  inScope: boolean;
  discoverySource: DiscoverySource;
  firstSeen: string;
  lastSeen: string;

  // Rede
  resolve: ResolveStatus;
  ips: string[];
  asn: string;
  provider: string;
  openPorts: string[];
  cname: string;

  // Fingerprint web
  httpStatus: string;
  pageTitle: string;
  techStack: string[];
  waf: string;
  tlsInfo: string;
  screenshot: string;

  // Superfície de ataque
  endpoints: string[];
  parameters: string[];
  directories: string[];
  jsFiles: string[];
  hasAuth: boolean;
  notableFeatures: string[];

  // Triagem
  status: AssetStatus;
  priority: Priority;
  tags: string[];
  findingIds: string[];
  notes: string;
  lastTested: string;

  // Optional because assets persisted before this field existed (seed data,
  // older localStorage/Supabase records) won't have them — default to [].
  customFields?: CustomField[];
  observationLog?: ObservationEntry[];
  attachments?: AssetAttachment[];
};

export const ASSET_TYPES: AssetType[] = [
  'domínio',
  'subdomínio',
  'IP',
  'CIDR',
  'URL',
  'endpoint de API',
  'app mobile',
  'repositório',
  'bucket',
  'wildcard',
];

export const DISCOVERY_SOURCES: DiscoverySource[] = ['subfinder', 'amass', 'crt.sh', 'ASN', 'dork', 'GitHub', 'Shodan', 'manual', 'outro'];

export const RESOLVE_STATUSES: ResolveStatus[] = ['vivo', 'morto', 'não verificado'];

export const ASSET_STATUSES: AssetStatus[] = ['não testado', 'em andamento', 'testado', 'interessante', 'morto'];

export const PRIORITIES: Priority[] = ['baixa', 'média', 'alta', 'crítica'];

export const PRIORITY_SEVERITY_VAR: Record<Priority, string> = {
  crítica: 'critical',
  alta: 'high',
  média: 'medium',
  baixa: 'low',
};

export const assets: Asset[] = [
  {
    id: 'asset-auth-acme',
    type: 'subdomínio',
    host: 'auth.acme-cloud.com',
    programId: 'h1-acme-cloud',
    inScope: true,
    discoverySource: 'subfinder',
    firstSeen: '2026-01-12',
    lastSeen: '2026-06-10',
    resolve: 'vivo',
    ips: ['52.84.10.21'],
    asn: 'AS16509',
    provider: 'Amazon CloudFront',
    openPorts: ['443/https', '80/http'],
    cname: 'd123abc.cloudfront.net',
    httpStatus: '200',
    pageTitle: 'Acme Cloud — Sign in',
    techStack: ['Nginx', 'Node.js', 'AWS ALB'],
    waf: 'AWS WAF',
    tlsInfo: 'Let\'s Encrypt R3 — válido até 2026-09-02',
    screenshot: 'auth-acme-cloud-home.png',
    endpoints: ['/oauth/callback', '/login', '/session/refresh'],
    parameters: ['code', 'state', 'redirect_uri'],
    directories: ['/static/', '/.well-known/'],
    jsFiles: ['bundle.main.js', 'vendor.js'],
    hasAuth: true,
    notableFeatures: ['OAuth social login', 'SSO'],
    status: 'testado',
    priority: 'crítica',
    tags: ['auth', 'oauth', 'prioritário'],
    findingIds: ['account-takeover-oauth-state'],
    notes: 'Origem do report de OAuth state reuse. Vale revisitar o fluxo de logout.',
    lastTested: '2026-04-10',
  },
  {
    id: 'asset-admin-acme',
    type: 'subdomínio',
    host: 'admin.acme-cloud.com',
    programId: 'h1-acme-cloud',
    inScope: true,
    discoverySource: 'crt.sh',
    firstSeen: '2026-01-15',
    lastSeen: '2026-06-08',
    resolve: 'vivo',
    ips: ['104.18.22.9'],
    asn: 'AS13335',
    provider: 'Cloudflare',
    openPorts: ['443/https'],
    cname: '',
    httpStatus: '200',
    pageTitle: 'Acme Cloud — Admin',
    techStack: ['React', 'Cloudflare'],
    waf: 'Cloudflare',
    tlsInfo: 'Cloudflare Inc ECC CA-3 — válido até 2026-08-01',
    screenshot: '',
    endpoints: ['/api/admin/users', '/api/admin/settings'],
    parameters: ['userId', 'page'],
    directories: [],
    jsFiles: ['admin.bundle.js'],
    hasAuth: true,
    notableFeatures: ['painel admin'],
    status: 'em andamento',
    priority: 'alta',
    tags: ['admin'],
    findingIds: [],
    notes: 'Painel administrativo — ainda mapeando endpoints internos.',
    lastTested: '',
  },
  {
    id: 'asset-app-acme',
    type: 'subdomínio',
    host: 'app.acme-cloud.com',
    programId: 'h1-acme-cloud',
    inScope: true,
    discoverySource: 'subfinder',
    firstSeen: '2026-01-12',
    lastSeen: '2026-06-10',
    resolve: 'vivo',
    ips: ['52.84.10.45'],
    asn: 'AS16509',
    provider: 'Amazon CloudFront',
    openPorts: ['443/https'],
    cname: '',
    httpStatus: '200',
    pageTitle: 'Acme Cloud — Dashboard',
    techStack: ['React', 'Node.js'],
    waf: 'AWS WAF',
    tlsInfo: '',
    screenshot: '',
    endpoints: [],
    parameters: [],
    directories: [],
    jsFiles: [],
    hasAuth: true,
    notableFeatures: [],
    status: 'não testado',
    priority: 'média',
    tags: [],
    findingIds: ['stored-xss-editor-perfil'],
    notes: '',
    lastTested: '',
  },
  {
    id: 'asset-api-fintech',
    type: 'endpoint de API',
    host: 'api.fintech.com',
    programId: 'bc-fintech-web',
    inScope: true,
    discoverySource: 'manual',
    firstSeen: '2026-02-01',
    lastSeen: '2026-06-09',
    resolve: 'vivo',
    ips: ['203.0.113.41'],
    asn: 'AS14618',
    provider: 'AWS',
    openPorts: ['443/https'],
    cname: '',
    httpStatus: '200',
    pageTitle: '',
    techStack: ['Express', 'PostgreSQL'],
    waf: 'nenhum detectado',
    tlsInfo: 'DigiCert — válido até 2027-01-10',
    screenshot: '',
    endpoints: ['/v2/reports/:id/export', '/v2/users/:id', '/v2/transactions'],
    parameters: ['id', 'format', 'range'],
    directories: [],
    jsFiles: [],
    hasAuth: true,
    notableFeatures: ['API REST', 'exportação de relatórios'],
    status: 'testado',
    priority: 'crítica',
    tags: ['api', 'financeiro', 'prioritário'],
    findingIds: ['idor-export-relatorios'],
    notes: 'IDOR confirmado em /v2/reports/:id/export. Verificar outros endpoints com :id.',
    lastTested: '2026-03-22',
  },
  {
    id: 'asset-app-fintech',
    type: 'subdomínio',
    host: 'app.fintech.com',
    programId: 'bc-fintech-web',
    inScope: true,
    discoverySource: 'amass',
    firstSeen: '2026-02-01',
    lastSeen: '2026-06-09',
    resolve: 'vivo',
    ips: ['203.0.113.50'],
    asn: 'AS14618',
    provider: 'AWS',
    openPorts: ['443/https', '80/http'],
    cname: '',
    httpStatus: '200',
    pageTitle: 'Fintech — Minha conta',
    techStack: ['Vue', 'Nginx'],
    waf: 'nenhum detectado',
    tlsInfo: '',
    screenshot: '',
    endpoints: ['/settings/security', '/settings/security/mfa/disable'],
    parameters: [],
    directories: [],
    jsFiles: [],
    hasAuth: true,
    notableFeatures: ['MFA'],
    status: 'em andamento',
    priority: 'alta',
    tags: ['mfa'],
    findingIds: ['csrf-toggle-mfa'],
    notes: 'Testando fluxo de segurança (MFA, sessão) — CSRF em validação.',
    lastTested: '',
  },
  {
    id: 'asset-api-orbit',
    type: 'endpoint de API',
    host: 'api.orbit.app',
    programId: 'h1-orbit-mobile',
    inScope: true,
    discoverySource: 'manual',
    firstSeen: '2026-01-20',
    lastSeen: '2026-06-01',
    resolve: 'vivo',
    ips: ['35.190.10.5'],
    asn: 'AS15169',
    provider: 'Google Cloud',
    openPorts: ['443/https'],
    cname: '',
    httpStatus: '200',
    pageTitle: '',
    techStack: ['Go', 'gRPC-Gateway'],
    waf: 'nenhum detectado',
    tlsInfo: '',
    screenshot: '',
    endpoints: ['/v1/me', '/v1/sessions'],
    parameters: [],
    directories: [],
    jsFiles: [],
    hasAuth: true,
    notableFeatures: ['API REST'],
    status: 'testado',
    priority: 'alta',
    tags: ['api', 'mobile-backend'],
    findingIds: ['cors-permissivo-perfil'],
    notes: 'CORS permissivo encontrado em /v1/me.',
    lastTested: '2026-02-20',
  },
  {
    id: 'asset-android-orbit',
    type: 'app mobile',
    host: 'com.orbit.mobile (Android)',
    programId: 'h1-orbit-mobile',
    inScope: true,
    discoverySource: 'manual',
    firstSeen: '2026-01-20',
    lastSeen: '2026-01-20',
    resolve: 'não verificado',
    ips: [],
    asn: '',
    provider: '',
    openPorts: [],
    cname: '',
    httpStatus: '',
    pageTitle: '',
    techStack: ['Android/Kotlin'],
    waf: '',
    tlsInfo: '',
    screenshot: '',
    endpoints: [],
    parameters: [],
    directories: [],
    jsFiles: [],
    hasAuth: true,
    notableFeatures: [],
    status: 'não testado',
    priority: 'média',
    tags: ['mobile'],
    findingIds: [],
    notes: 'Build público da loja, ainda não extraído com jadx.',
    lastTested: '',
  },
  {
    id: 'asset-leak-bundle-orbit',
    type: 'URL',
    host: 'app.orbit.app/static/bundle.js',
    programId: 'h1-orbit-mobile',
    inScope: true,
    discoverySource: 'dork',
    firstSeen: '2026-03-25',
    lastSeen: '2026-03-25',
    resolve: 'vivo',
    ips: [],
    asn: '',
    provider: '',
    openPorts: [],
    cname: '',
    httpStatus: '200',
    pageTitle: '',
    techStack: ['JavaScript'],
    waf: '',
    tlsInfo: '',
    screenshot: '',
    endpoints: [],
    parameters: [],
    directories: [],
    jsFiles: ['bundle.js'],
    hasAuth: false,
    notableFeatures: ['segredo exposto'],
    status: 'interessante',
    priority: 'crítica',
    tags: ['leak', 'secrets', 'prioritário'],
    findingIds: ['leak-internal-api-key'],
    notes: 'Chave orbit_internal_sk_live_... encontrada em texto plano — validar nível de acesso.',
    lastTested: '',
  },
  {
    id: 'asset-api-platform',
    type: 'endpoint de API',
    host: 'api.platform.io',
    programId: 'int-platform-api',
    inScope: true,
    discoverySource: 'manual',
    firstSeen: '2026-01-05',
    lastSeen: '2026-02-10',
    resolve: 'vivo',
    ips: ['198.51.100.12'],
    asn: 'AS8075',
    provider: 'Azure',
    openPorts: ['443/https', '8443/https-alt'],
    cname: '',
    httpStatus: '200',
    pageTitle: '',
    techStack: ['Kong Gateway', 'Java/Spring'],
    waf: 'nenhum detectado',
    tlsInfo: '',
    screenshot: '',
    endpoints: ['/v1/webhooks/import'],
    parameters: ['url'],
    directories: [],
    jsFiles: [],
    hasAuth: true,
    notableFeatures: ['webhooks', 'API REST'],
    status: 'testado',
    priority: 'alta',
    tags: ['api', 'ssrf'],
    findingIds: ['ssrf-webhooks'],
    notes: 'SSRF no importador de webhooks — programa pausado, sem novas submissões.',
    lastTested: '2026-01-30',
  },
  {
    id: 'asset-webhooks-platform',
    type: 'subdomínio',
    host: 'webhooks.platform.io',
    programId: 'int-platform-api',
    inScope: false,
    discoverySource: 'crt.sh',
    firstSeen: '2026-01-05',
    lastSeen: '2026-01-05',
    resolve: 'não verificado',
    ips: [],
    asn: '',
    provider: '',
    openPorts: [],
    cname: '',
    httpStatus: '',
    pageTitle: '',
    techStack: ['Java/Spring'],
    waf: '',
    tlsInfo: '',
    screenshot: '',
    endpoints: [],
    parameters: [],
    directories: [],
    jsFiles: [],
    hasAuth: false,
    notableFeatures: [],
    status: 'não testado',
    priority: 'baixa',
    tags: [],
    findingIds: [],
    notes: 'Programa pausado para revisão de escopo — fora de escopo por ora.',
    lastTested: '',
  },
  {
    id: 'asset-gateway-shadow',
    type: 'subdomínio',
    host: 'gateway.shadow.io',
    programId: 'ywh-shadow-gateway',
    inScope: true,
    discoverySource: 'amass',
    firstSeen: '2026-01-08',
    lastSeen: '2026-06-15',
    resolve: 'vivo',
    ips: ['51.15.10.20'],
    asn: 'AS12876',
    provider: 'Scaleway',
    openPorts: ['443/https', '8080/http-alt'],
    cname: '',
    httpStatus: '200',
    pageTitle: 'Shadow Gateway',
    techStack: ['Envoy', 'Go'],
    waf: 'nenhum detectado',
    tlsInfo: '',
    screenshot: '',
    endpoints: ['/v1/coupons/redeem'],
    parameters: ['code'],
    directories: [],
    jsFiles: [],
    hasAuth: true,
    notableFeatures: ['API REST'],
    status: 'em andamento',
    priority: 'média',
    tags: ['race-condition'],
    findingIds: ['race-condition-cupons'],
    notes: 'Janela de manutenção: terças, 02h–04h UTC. Evitar fuzzing fora desse período.',
    lastTested: '',
  },
  {
    id: 'asset-gateway-eu-shadow',
    type: 'subdomínio',
    host: 'gateway-eu.shadow.io',
    programId: 'ywh-shadow-gateway',
    inScope: true,
    discoverySource: 'amass',
    firstSeen: '2026-01-08',
    lastSeen: '2026-05-20',
    resolve: 'vivo',
    ips: ['51.15.10.30'],
    asn: 'AS12876',
    provider: 'Scaleway',
    openPorts: ['443/https'],
    cname: '',
    httpStatus: '200',
    pageTitle: '',
    techStack: ['Envoy'],
    waf: '',
    tlsInfo: '',
    screenshot: '',
    endpoints: [],
    parameters: [],
    directories: [],
    jsFiles: [],
    hasAuth: false,
    notableFeatures: [],
    status: 'não testado',
    priority: 'baixa',
    tags: [],
    findingIds: [],
    notes: '',
    lastTested: '',
  },
  {
    id: 'asset-login-shadow',
    type: 'URL',
    host: 'gateway.shadow.io/login',
    programId: 'ywh-shadow-gateway',
    inScope: true,
    discoverySource: 'manual',
    firstSeen: '2026-02-02',
    lastSeen: '2026-02-02',
    resolve: 'vivo',
    ips: [],
    asn: '',
    provider: '',
    openPorts: [],
    cname: '',
    httpStatus: '302',
    pageTitle: 'Login',
    techStack: [],
    waf: '',
    tlsInfo: '',
    screenshot: '',
    endpoints: ['/login?return='],
    parameters: ['return'],
    directories: [],
    jsFiles: [],
    hasAuth: true,
    notableFeatures: [],
    status: 'testado',
    priority: 'baixa',
    tags: ['open-redirect'],
    findingIds: ['open-redirect-login'],
    notes: 'Open redirect confirmado via parâmetro return.',
    lastTested: '2026-05-02',
  },
  {
    id: 'asset-northstar',
    type: 'domínio',
    host: 'northstar.dev',
    programId: 'vdp-northstar',
    inScope: true,
    discoverySource: 'manual',
    firstSeen: '2025-12-01',
    lastSeen: '2026-06-01',
    resolve: 'vivo',
    ips: ['76.76.21.21'],
    asn: 'AS14061',
    provider: 'Vercel',
    openPorts: ['443/https'],
    cname: 'cname.vercel-dns.com',
    httpStatus: '200',
    pageTitle: 'Northstar',
    techStack: ['Next.js', 'Vercel'],
    waf: 'nenhum detectado',
    tlsInfo: '',
    screenshot: 'northstar-home.png',
    endpoints: ['/invite'],
    parameters: ['email'],
    directories: [],
    jsFiles: [],
    hasAuth: true,
    notableFeatures: ['convites'],
    status: 'testado',
    priority: 'baixa',
    tags: ['vdp'],
    findingIds: ['enumeracao-convites'],
    notes: 'Enumeração de usuários no convite, já reportado via VDP.',
    lastTested: '2025-12-02',
  },
  {
    id: 'asset-legacy-portal',
    type: 'domínio',
    host: 'legacy-portal.acme.example',
    programId: 'h1-legacy-portal',
    inScope: false,
    discoverySource: 'crt.sh',
    firstSeen: '2025-06-01',
    lastSeen: '2025-08-01',
    resolve: 'morto',
    ips: [],
    asn: '',
    provider: '',
    openPorts: [],
    cname: '',
    httpStatus: '',
    pageTitle: '',
    techStack: [],
    waf: '',
    tlsInfo: '',
    screenshot: '',
    endpoints: [],
    parameters: [],
    directories: [],
    jsFiles: [],
    hasAuth: false,
    notableFeatures: [],
    status: 'morto',
    priority: 'baixa',
    tags: [],
    findingIds: [],
    notes: 'Programa encerrado em 2025 — domínio não resolve mais.',
    lastTested: '',
  },
];

export function getAsset(id: string): Asset | undefined {
  return assets.find((a) => a.id === id);
}

export function createBlankAsset(id: string): Asset {
  return {
    id,
    type: 'subdomínio',
    host: '',
    programId: '',
    inScope: true,
    discoverySource: 'manual',
    firstSeen: '',
    lastSeen: '',
    resolve: 'não verificado',
    ips: [],
    asn: '',
    provider: '',
    openPorts: [],
    cname: '',
    httpStatus: '',
    pageTitle: '',
    techStack: [],
    waf: '',
    tlsInfo: '',
    screenshot: '',
    endpoints: [],
    parameters: [],
    directories: [],
    jsFiles: [],
    hasAuth: false,
    notableFeatures: [],
    status: 'não testado',
    priority: 'média',
    tags: [],
    findingIds: [],
    notes: '',
    lastTested: '',
    customFields: [],
    observationLog: [],
    attachments: [],
  };
}
