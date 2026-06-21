import type { BBLabPayload, BBLabReport, BBLabSeverity } from '@/types/bb-lab';

type HackerOneDocument = {
  _id: string;
  cve_ids?: string[];
  cwe?: string | null;
  severity_rating?: BBLabSeverity | null;
  votes?: number | null;
  total_awarded_amount?: number | null;
  latest_disclosable_activity_at?: string | null;
  submitted_at?: string | null;
  reporter?: { username?: string | null; name?: string | null } | null;
  team?: {
    handle?: string | null;
    name?: string | null;
    currency?: string | null;
  } | null;
  report?: {
    title?: string | null;
    url?: string | null;
    disclosed_at?: string | null;
    report_generated_content?: {
      hacktivity_summary?: string | null;
    } | null;
  } | null;
};

type LearningProfile = {
  technique: string;
  surface: string;
  impact: string;
  title: string;
  summary: string;
  bypasses: string[];
  payloads: BBLabPayload[];
  practice: string[];
  questions: string[];
  tags: string[];
};

const PROFILES: Array<{ match: RegExp; value: LearningProfile }> = [
  {
    match: /open redirect|redirect url|redirect_uri|domain validation/i,
    value: {
      technique: 'Open Redirect',
      surface: 'Autenticação e OAuth',
      impact: 'Roubo de token, phishing confiável e tomada de conta',
      title: 'Redirecionamento aberto contorna a confiança de domínio',
      summary: 'A aplicação aceitou um destino controlado pelo atacante como se pertencesse ao domínio confiável. Quando esse fluxo transporta tokens ou códigos de autenticação, um “simples redirect” pode virar tomada de conta.',
      bypasses: ['Regex de domínio permissiva', 'Ponto não escapado na validação', 'Domínio malicioso que preserva o prefixo confiável'],
      payloads: [
        {
          label: 'Regex vulnerável publicada no report',
          code: '/(^|\\.)(khanacademy\\.(org|dev|test|local)|kastatic\\.org|.*-6fmjyrz2lq-uc.a.run.app)$/',
          note: 'O ponto antes de “a.run.app” funciona como curinga. No regex corrigido ele aparece escapado: uc\\.a\\.run\\.app.',
          source: 'report-publico',
        },
        {
          label: 'Hipótese para laboratório',
          code: 'https://subdominio-confiavel.exemplo-atacante.test/callback',
          note: 'Troque apenas por domínios que você controla em um laboratório. O objetivo é observar se a validação compara hostname real ou apenas um padrão textual.',
          source: 'laboratorio',
        },
      ],
      practice: ['Mapeie todos os parâmetros de retorno e callback.', 'Compare URL parseada com validações por substring ou regex.', 'Teste subdomínios, userinfo (@), barras, encoding e domínios parecidos.'],
      questions: ['A validação compara hostname ou a URL inteira?', 'Algum segredo aparece na URL após o redirect?', 'O destino é validado antes ou depois da normalização?'],
      tags: ['open-redirect', 'oauth', 'ato', 'regex'],
    },
  },
  {
    match: /xss|cross-site scripting|markdown.*image|html injection/i,
    value: {
      technique: 'Cross-site Scripting',
      surface: 'Renderização de conteúdo',
      impact: 'Execução de JavaScript no contexto da vítima',
      title: 'Entrada controlada atravessa o pipeline de renderização',
      summary: 'Conteúdo fornecido pelo usuário chegou a um renderizador sem uma política de sanitização compatível com o contexto final. O ponto decisivo costuma estar na transformação intermediária — Markdown, template, preview ou atributo HTML.',
      bypasses: ['Mudança de contexto durante a renderização', 'URL de imagem tratada como conteúdo seguro', 'Sanitização aplicada antes da transformação final'],
      payloads: [
        {
          label: 'Sonda de Markdown para laboratório',
          code: '![teste](https://seu-servidor-lab.test/imagem.png?origem=markdown)',
          note: 'Comece com uma URL inofensiva e observe como ela vira HTML. Só depois teste protocolos e atributos permitidos no ambiente autorizado.',
          source: 'laboratorio',
        },
      ],
      practice: ['Liste todas as entradas que viram preview ou rich text.', 'Teste protocolos, atributos e caracteres após cada transformação.', 'Compare o HTML antes e depois do sanitizador.'],
      questions: ['Qual componente produz o HTML final?', 'A sanitização ocorre antes ou depois do Markdown?', 'Protocolos e atributos são validados por contexto?'],
      tags: ['xss', 'markdown', 'rendering', 'sanitization'],
    },
  },
  {
    match: /idor|object id|access control|authorization|permission model|unauthenticated.*(read|delete|access)|improper access/i,
    value: {
      technique: 'Broken Access Control',
      surface: 'APIs e objetos',
      impact: 'Leitura ou alteração de recursos de outros usuários',
      title: 'Autorização falha ao resolver o objeto solicitado',
      summary: 'O backend encontrou o recurso indicado pelo cliente, mas não confirmou se o ator podia executar aquela ação sobre aquele objeto. O teste mais valioso é variar identidade, objeto e ação separadamente.',
      bypasses: ['Validação de caminho divergente da operação real', 'Objeto previsível ou enumerável', 'Método interno exposto sem checagem equivalente'],
      payloads: [
        {
          label: 'Matriz de duas identidades',
          code: 'GET /api/objetos/ID_DA_CONTA_B\nAuthorization: Bearer TOKEN_DA_CONTA_A',
          note: 'Use duas contas próprias. Mantenha o ator A e altere apenas o identificador do objeto criado pela conta B.',
          source: 'laboratorio',
        },
      ],
      practice: ['Crie duas contas e uma matriz ator × objeto × ação.', 'Troque IDs em path, body, GraphQL, headers e métodos.', 'Repita ações de leitura, edição, exclusão e exportação.'],
      questions: ['A autorização está no controller ou na camada de dados?', 'O ID é suficiente para localizar o objeto?', 'Há diferença entre UI, REST, GraphQL e canais em tempo real?'],
      tags: ['idor', 'bola', 'access-control', 'api'],
    },
  },
  {
    match: /ssrf|server.side request|webhook|url fetch/i,
    value: {
      technique: 'SSRF',
      surface: 'Integrações e fetchers',
      impact: 'Acesso a serviços internos, metadata ou redes protegidas',
      title: 'Fetcher do servidor alcança destinos fora da confiança',
      summary: 'Uma funcionalidade que busca URLs em nome do usuário permitiu atravessar a fronteira de rede esperada. O foco prático é descobrir em qual etapa host, DNS, redirect e IP são validados.',
      bypasses: ['Redirect após validação inicial', 'DNS rebinding ou resolução divergente', 'Representações alternativas de IP e hostname'],
      payloads: [
        {
          label: 'Redirect controlado em laboratório',
          code: 'https://seu-servidor-lab.test/redireciona?para=http://127.0.0.1/',
          note: 'Serve para descobrir se o destino final é validado novamente. Não aponte para redes ou serviços que você não está autorizado a testar.',
          source: 'laboratorio',
        },
      ],
      practice: ['Catalogue webhooks, previews, imports e validadores de URL.', 'Teste redirects e mudanças entre hostname e IP resolvido.', 'Observe diferenças de resposta, tempo e protocolos aceitos.'],
      questions: ['O IP final é validado após DNS e redirects?', 'A aplicação segue redirects automaticamente?', 'Quais protocolos e portas o cliente HTTP permite?'],
      tags: ['ssrf', 'cloud', 'metadata', 'network'],
    },
  },
  {
    match: /sql injection|sqli|database query/i,
    value: {
      technique: 'SQL Injection',
      surface: 'Consultas e filtros',
      impact: 'Leitura, alteração ou destruição de dados',
      title: 'Entrada modifica a estrutura da consulta',
      summary: 'Dados controlados pelo usuário alcançaram uma consulta sem separação segura entre instrução e valor. Filtros, ordenação, busca avançada e relatórios costumam ser superfícies esquecidas.',
      bypasses: ['Encoding interpretado em camadas diferentes', 'Parâmetro não coberto pelo ORM', 'Concatenação em ordenação ou filtros dinâmicos'],
      payloads: [
        {
          label: 'Sonda booleana de laboratório',
          code: "' AND '1'='1' -- ",
          note: 'Use somente em aplicações de treino. Compare com uma condição falsa e observe diferenças controladas de resposta.',
          source: 'laboratorio',
        },
      ],
      practice: ['Mapeie parâmetros que alteram filtro, coluna ou ordenação.', 'Compare erros, conteúdo e tempo de resposta.', 'Procure consultas montadas parcialmente fora do ORM.'],
      questions: ['O valor usa bind parameter?', 'O parâmetro escolhe nomes de coluna ou operadores?', 'Há normalização diferente entre WAF e banco?'],
      tags: ['sqli', 'database', 'injection'],
    },
  },
  {
    match: /command injection|code injection|remote code|rce|shell/i,
    value: {
      technique: 'Injeção de código',
      surface: 'Processamento no servidor',
      impact: 'Execução de comandos ou código arbitrário',
      title: 'Dado não confiável alcança um interpretador',
      summary: 'A entrada cruzou uma fronteira perigosa — shell, template, runtime ou compilador — mantendo significado executável. O caminho de exploração geralmente nasce em uma transformação considerada “apenas texto”.',
      bypasses: ['Separadores alternativos e quebras de linha', 'Decodificação após a validação', 'Opção ou argumento interpretado como comando'],
      payloads: [
        {
          label: 'Sonda temporal inofensiva',
          code: 'valor; sleep 2',
          note: 'Exemplo para um laboratório Unix deliberadamente vulnerável. O atraso ajuda a confirmar interpretação sem produzir arquivos ou conexões externas.',
          source: 'laboratorio',
        },
      ],
      practice: ['Identifique conversores, builders, exportadores e ferramentas CLI.', 'Teste metacaracteres conforme o interpretador real.', 'Use provas inofensivas baseadas em tempo ou saída controlada.'],
      questions: ['Existe shell no caminho ou execução direta de processo?', 'Quantas etapas decodificam a entrada?', 'O valor pode virar opção de linha de comando?'],
      tags: ['rce', 'command-injection', 'code-injection'],
    },
  },
  {
    match: /path traversal|path misvalidation|file read|file deletion|arbitrary file|zip slip/i,
    value: {
      technique: 'Path Traversal',
      surface: 'Arquivos e caminhos',
      impact: 'Leitura, escrita ou exclusão fora do diretório permitido',
      title: 'Validação de caminho diverge do arquivo realmente acessado',
      summary: 'A aplicação tentou limitar um caminho, mas a normalização ou resolução final produziu outro destino. Caminhos absolutos, segmentos relativos, symlinks e decodificação tardia são os desvios mais férteis.',
      bypasses: ['Normalização depois da checagem', 'Prefixo textual sem boundary de diretório', 'Encoding ou separador alternativo'],
      payloads: [
        {
          label: 'Sonda de caminho em laboratório',
          code: '../../arquivo-de-teste.txt',
          note: 'Crie um arquivo marcador sem dados sensíveis fora da pasta esperada e verifique se a aplicação atravessa o limite.',
          source: 'laboratorio',
        },
      ],
      practice: ['Compare caminho recebido, normalizado e resolvido.', 'Teste absolutos, ../, encoding duplo e separadores da plataforma.', 'Verifique leitura, escrita, exportação e exclusão.'],
      questions: ['A checagem usa string ou caminho canônico?', 'Symlinks são resolvidos antes da autorização?', 'O sistema operacional aceita outro separador?'],
      tags: ['path-traversal', 'files', 'lfi'],
    },
  },
  {
    match: /resource consumption|denial of service|dos|memory|goaway|queue|overflow/i,
    value: {
      technique: 'Negação de serviço',
      surface: 'Recursos e protocolos',
      impact: 'Exaustão de memória, CPU, conexões ou filas',
      title: 'Estado ou recurso não é liberado sob entrada adversarial',
      summary: 'Uma sequência válida ou quase válida mantém recursos vivos além do esperado. O aprendizado central é acompanhar o ciclo de vida: criação, erro, cancelamento, teardown e contabilização.',
      bypasses: ['Caminho de erro sem cleanup', 'Contador global divergente da memória real', 'Estado parcialmente encerrado que ainda aceita dados'],
      payloads: [
        {
          label: 'Sequência de teste',
          code: 'abrir → provocar erro de protocolo → manter envio → encerrar → medir recursos',
          note: 'O payload aqui é uma sequência de estados. Use limites baixos e monitore o processo para não derrubar ambientes compartilhados.',
          source: 'laboratorio',
        },
      ],
      practice: ['Modele estados e transições do protocolo.', 'Meça recursos antes, durante e após erros repetidos.', 'Teste cancelamento, timeout, teardown e mensagens fora de ordem.'],
      questions: ['Todo caminho de erro libera o mesmo recurso?', 'Há limite por conexão e limite global?', 'Contadores são decrementados no teardown?'],
      tags: ['dos', 'resource-exhaustion', 'protocol'],
    },
  },
  {
    match: /authentication|account takeover|token|session|jwt|password reset/i,
    value: {
      technique: 'Falha de autenticação',
      surface: 'Sessões e identidade',
      impact: 'Tomada de conta ou autenticação sem credenciais válidas',
      title: 'Fluxo de identidade aceita uma prova fora do contexto',
      summary: 'Um token, sessão ou etapa de recuperação foi aceito sem vinculação suficiente ao usuário, dispositivo, finalidade ou momento que o originou.',
      bypasses: ['Token reutilizável em outro contexto', 'Etapa do fluxo executável fora de ordem', 'Validação parcial de emissor, público ou finalidade'],
      payloads: [
        {
          label: 'Teste de vinculação entre contas',
          code: '1. Gerar token na conta A\n2. Trocar para a sessão da conta B\n3. Reutilizar o token de A na etapa seguinte',
          note: 'Faça isso apenas com contas próprias para verificar se o artefato está ligado ao usuário e à finalidade correta.',
          source: 'laboratorio',
        },
      ],
      practice: ['Desenhe o fluxo completo de login e recuperação.', 'Reutilize artefatos entre contas, clientes e etapas.', 'Teste expiração, rotação, logout e concorrência.'],
      questions: ['Ao que exatamente o token está vinculado?', 'Uma etapa pode ser pulada ou repetida?', 'Logout e troca de senha invalidam sessões antigas?'],
      tags: ['auth', 'ato', 'session', 'token'],
    },
  },
];

const DEFAULT_PROFILE: LearningProfile = {
  technique: 'Lógica de aplicação',
  surface: 'Fluxos e integrações',
  impact: 'Quebra de uma premissa de segurança do produto',
  title: 'Premissa de segurança falha em um fluxo real',
  summary: 'O report mostra uma diferença entre o comportamento esperado e o comportamento que um usuário adversarial consegue provocar. Reproduza primeiro a regra de negócio e depois varie ator, ordem, estado e origem dos dados.',
  bypasses: ['Premissa implícita não validada no servidor'],
  payloads: [],
  practice: ['Desenhe o fluxo feliz e suas pré-condições.', 'Repita as etapas fora de ordem e com identidades diferentes.', 'Procure decisões baseadas apenas no cliente.'],
  questions: ['Qual premissa o servidor está aceitando sem provar?', 'O que muda ao repetir ou reordenar a ação?', 'Outro canal oferece a mesma ação com menos validações?'],
  tags: ['business-logic', 'methodology'],
};

function chooseProfile(text: string): LearningProfile {
  return PROFILES.find(({ match }) => match.test(text))?.value ?? DEFAULT_PROFILE;
}

export function enrichHackerOneReport(document: HackerOneDocument): BBLabReport | null {
  const report = document.report;
  if (!report?.title || !report.url) return null;

  const sourceText = [
    report.title,
    report.report_generated_content?.hacktivity_summary,
    document.cwe,
  ].filter(Boolean).join(' ');
  const profile = chooseProfile(sourceText);
  const program = document.team?.name || document.team?.handle || 'Programa não informado';
  const researcher = document.reporter?.username || 'pesquisador';

  return {
    id: document._id,
    titleOriginal: report.title,
    titlePt: profile.title,
    summaryPt: profile.summary,
    program,
    programHandle: document.team?.handle || '',
    researcher,
    researcherName: document.reporter?.name || '',
    severity: document.severity_rating || 'None',
    cwe: document.cwe || 'CWE não informado',
    cves: document.cve_ids || [],
    bounty: document.total_awarded_amount ?? null,
    currency: (document.team?.currency || 'usd').toUpperCase(),
    votes: document.votes || 0,
    disclosedAt: report.disclosed_at || document.latest_disclosable_activity_at || '',
    submittedAt: document.submitted_at || '',
    url: report.url,
    technique: profile.technique,
    surface: profile.surface,
    impact: profile.impact,
    bypasses: profile.bypasses,
    payloads: profile.payloads,
    practice: profile.practice,
    fieldQuestions: profile.questions,
    tags: Array.from(new Set([...profile.tags, researcher, document.team?.handle || ''].filter(Boolean))),
  };
}

export const HACKERONE_QUERY = `
  query HacktivitySearchQuery(
    $queryString: String!
    $from: Int
    $size: Int
    $sort: SortInput!
  ) {
    me { id }
    search(
      index: CompleteHacktivityReportIndex
      query_string: $queryString
      from: $from
      size: $size
      sort: $sort
    ) {
      total_count
      nodes {
        __typename
        ... on HacktivityDocument {
          _id
          cve_ids
          cwe
          severity_rating
          votes
          total_awarded_amount
          latest_disclosable_activity_at
          submitted_at
          disclosed
          reporter { username name }
          team { handle name currency }
          report {
            title
            url
            disclosed_at
            report_generated_content { hacktivity_summary }
          }
        }
      }
    }
  }
`;

export type { HackerOneDocument };
