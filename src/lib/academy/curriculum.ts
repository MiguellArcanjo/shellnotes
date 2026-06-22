// The learning path. Beginner-first, ordered, with prerequisites so the academy
// guides instead of dumping. Each technique module links back to the real
// HackerOne reports the app already ingests, and each lab is either executed for
// real (sql / xss) or graded openly by the Claude mentor on the droplet.

import type { SqlResult } from './sqlEngine';

export type Difficulty = 'iniciante' | 'fácil' | 'médio' | 'avançado';

export type Lesson = {
  id: string;
  title: string;
  minutes: number;
  body: string[];
  keyPoints: string[];
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
};

export type SqlLab = {
  kind: 'sql';
  id: string;
  title: string;
  difficulty: Difficulty;
  scenario: string;
  goal: string;
  template: string;
  /** Shown next to the editor so the player sees the vulnerable concatenation. */
  templateLabel: string;
  starter: string;
  success: (result: SqlResult) => boolean;
  solution: string;
  debrief: string;
};

export type XssContext = 'html' | 'attribute' | 'js';

export type XssLab = {
  kind: 'xss';
  id: string;
  title: string;
  difficulty: Difficulty;
  scenario: string;
  goal: string;
  context: XssContext;
  /** HTML fragment containing __INPUT__ — the vulnerable sink. */
  template: string;
  templateLabel: string;
  starter: string;
  solution: string;
  debrief: string;
};

export type ChallengeLab = {
  kind: 'challenge';
  id: string;
  title: string;
  difficulty: Difficulty;
  scenario: string;
  goal: string;
  starter: string;
  /** Offline heuristic so the lab works even if the mentor is offline. */
  expected: string[];
  successResponse: string;
  failureResponse: string;
  solution: string;
  debrief: string;
};

export type Lab = SqlLab | XssLab | ChallengeLab;

export type Module = {
  id: string;
  title: string;
  tagline: string;
  icon: string;
  difficulty: Difficulty;
  /** HackerOne `report.technique` value used to surface real disclosures. */
  technique: string | null;
  requires: string[];
  lessons: Lesson[];
  labs: Lab[];
  quiz: QuizQuestion[];
};

function rowsText(result: SqlResult): string {
  return result.rows
    .map((row) => Object.values(row).join(' '))
    .join(' ')
    .toLowerCase();
}

function rowsContain(result: SqlResult, needles: string[]): boolean {
  const text = rowsText(result);
  return needles.some((needle) => text.includes(needle.toLowerCase()));
}

export const CURRICULUM: Module[] = [
  // -------------------------------------------------------------------------
  {
    id: 'fundamentos',
    title: 'Fundamentos da Web',
    tagline: 'Como a web realmente funciona — e onde ela quebra.',
    icon: 'Globe',
    difficulty: 'iniciante',
    technique: null,
    requires: [],
    lessons: [
      {
        id: 'http',
        title: 'O ciclo de uma requisição HTTP',
        minutes: 6,
        body: [
          'Toda interação web é uma troca de mensagens de texto: o cliente envia uma REQUISIÇÃO e o servidor devolve uma RESPOSTA. Entender essas duas mensagens é 80% do trabalho de quem caça bugs.',
          'Uma requisição tem: a linha de método e caminho (ex.: GET /api/orders/1042), os cabeçalhos (Host, Authorization, Cookie, Content-Type) e, opcionalmente, um corpo. A resposta tem: a linha de status (200, 302, 401, 500), cabeçalhos e o corpo.',
          'A ideia central do hacking web: o servidor confia em dados que VOCÊ controla. Caminho, parâmetros de query, corpo JSON, cookies e cabeçalhos são todos editáveis pelo cliente. Sempre que o servidor toma uma decisão baseada nesses dados sem revalidar, existe uma porta.',
        ],
        keyPoints: [
          'Métodos comuns: GET (ler), POST (criar), PUT/PATCH (atualizar), DELETE (apagar).',
          'Autenticação ≠ Autorização: provar quem você é vs. ter permissão para o objeto.',
          'Tudo que sai do navegador pode ser alterado antes de chegar ao servidor.',
        ],
      },
      {
        id: 'recon',
        title: 'Mentalidade do hunter: hipótese e evidência',
        minutes: 5,
        body: [
          'Hacker bom não chuta payload aleatório. Ele observa o comportamento normal, formula uma hipótese ("e se eu trocar este ID?"), testa uma mudança por vez e registra a evidência da diferença.',
          'O fluxo que você vai repetir em todos os labs daqui: 1) Baseline — veja a resposta normal. 2) Hipótese — qual confiança indevida o servidor pode ter? 3) Prova — mude UMA coisa e compare a resposta. 4) Registro — anote a request, a mudança e o sinal de sucesso.',
          'Esse caderno de evidências é o que vira um report pago depois. Sem evidência reproduzível, não há bounty.',
        ],
        keyPoints: [
          'Mude uma variável por vez para isolar a causa.',
          'O sinal de sucesso é a DIFERENÇA entre a resposta normal e a manipulada.',
          'Só teste em alvos onde você tem autorização explícita.',
        ],
      },
    ],
    labs: [],
    quiz: [
      {
        id: 'q-auth',
        prompt: 'Um servidor verifica seu token (você está logado) mas entrega o pedido de outro usuário quando você troca o ID na URL. Qual conceito falhou?',
        options: ['Autenticação', 'Autorização', 'Criptografia', 'Validação de entrada'],
        answer: 1,
        explanation: 'A autenticação funcionou (ele sabia quem você era), mas a autorização falhou: não checou se o objeto pertencia a você. Esse é o coração do IDOR.',
      },
      {
        id: 'q-control',
        prompt: 'Qual destes dados o cliente NÃO pode alterar antes de enviar ao servidor?',
        options: ['O cabeçalho Cookie', 'O corpo JSON', 'O parâmetro de query', 'Nenhuma das anteriores — todos são editáveis'],
        answer: 3,
        explanation: 'Tudo que sai do navegador é controlável pelo cliente (com um proxy como o Burp). Nunca confie em validação feita apenas no front-end.',
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    id: 'access-control',
    title: 'Controle de Acesso & IDOR',
    tagline: 'A falha nº 1 do OWASP: acessar o que não é seu.',
    icon: 'KeyRound',
    difficulty: 'iniciante',
    technique: 'Broken Access Control',
    requires: ['fundamentos'],
    lessons: [
      {
        id: 'idor',
        title: 'IDOR: quando o ID é a única tranca',
        minutes: 6,
        body: [
          'IDOR (Insecure Direct Object Reference) acontece quando a aplicação usa um identificador que você controla (ex.: /api/orders/1042) para buscar um objeto, mas não verifica se aquele objeto é seu.',
          'A prova forte de IDOR usa DUAS identidades: você mantém a sessão da conta A e tenta acessar um recurso que pertence à conta B. Se conseguir, está provado. Manter o ator e mudar só o objeto é o que separa um achado real de um falso positivo.',
          'Variações: IDs sequenciais (1042 → 1043), UUIDs vazados em respostas anteriores, IDs em corpo JSON ou em parâmetros escondidos, e "mass assignment" (enviar role=admin num PATCH de perfil).',
        ],
        keyPoints: [
          'Sempre teste com duas contas — A autenticada, objeto de B.',
          'Procure IDs em URLs, JSON, cookies e respostas anteriores.',
          'GET, POST, PUT e DELETE podem ter autorização diferente — teste todos.',
        ],
      },
    ],
    labs: [
      {
        kind: 'challenge',
        id: 'idor-orders',
        title: 'Pedido de outra conta',
        difficulty: 'iniciante',
        scenario: 'Você está logado como conta A (pedido 1042). A conta B criou o pedido 1049. O backend confia no ID da URL.',
        goal: 'Acessar o pedido da conta B mantendo a sessão da conta A.',
        starter: `GET /api/orders/1042 HTTP/1.1
Host: lab.shellnotes.local
Authorization: Bearer TOKEN_CONTA_A
Accept: application/json`,
        expected: ['/api/orders/1049', 'token_conta_a'],
        successResponse: `HTTP/1.1 200 OK
Content-Type: application/json

{ "id": 1049, "owner": "conta-b", "total": 289.90, "status": "processing" }`,
        failureResponse: `HTTP/1.1 200 OK
Content-Type: application/json

{ "id": 1042, "owner": "conta-a", "total": 49.90, "status": "delivered" }`,
        solution: "Troque apenas o ID do caminho para /api/orders/1049 e mantenha o Bearer TOKEN_CONTA_A.",
        debrief: 'O backend encontrou o objeto mas não checou o dono. A prova forte manteve o ator A e mudou só o objeto para um recurso da conta B.',
      },
    ],
    quiz: [
      {
        id: 'q-idor-proof',
        prompt: 'Ao testar IDOR, por que você NÃO deve trocar o token de autenticação junto com o ID?',
        options: [
          'Porque trocaria o teste de autorização por um teste de autenticação',
          'Porque o token é criptografado',
          'Porque o servidor bloqueia tokens trocados',
          'Não faz diferença',
        ],
        answer: 0,
        explanation: 'Mantendo o token de A e mudando só o objeto, você prova que A pode ler dados de B — isso é falha de autorização. Trocar o token misturaria os conceitos.',
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    id: 'sqli',
    title: 'SQL Injection',
    tagline: 'Quando sua entrada vira parte da consulta do banco.',
    icon: 'Database',
    difficulty: 'fácil',
    technique: 'SQL Injection',
    requires: ['fundamentos'],
    lessons: [
      {
        id: 'sqli-basics',
        title: 'Por que SQLi acontece',
        minutes: 7,
        body: [
          'O backend monta consultas concatenando texto. Se ele faz "... WHERE category = \'" + entrada + "\'", e você envia uma entrada com aspas, você sai do dado e entra na ESTRUTURA da query.',
          'O payload clássico \' OR \'1\'=\'1 fecha a string da categoria e adiciona uma condição sempre verdadeira. Resultado: o filtro deixa de filtrar e o banco devolve tudo — inclusive linhas que deveriam estar escondidas.',
          'Os comentários -- e # cortam o resto da query original, úteis para descartar aspas ou condições que sobrariam depois do seu payload.',
          'Nos labs a seguir o motor SQL é REAL: sua entrada é concatenada e a query é de fato avaliada. Não existe resposta "certa" decorada — qualquer payload que altere a lógica corretamente funciona.',
        ],
        keyPoints: [
          'Aspas (\') são o gatilho: testam se você consegue sair do contexto de dado.',
          "' OR '1'='1 transforma o WHERE numa condição sempre verdadeira.",
          'UNION SELECT cola os resultados de OUTRA tabela na mesma resposta.',
          'Defesa real: consultas parametrizadas (prepared statements), não escaping manual.',
        ],
      },
    ],
    labs: [
      {
        kind: 'sql',
        id: 'sqli-boolean',
        title: 'Vazando produtos ocultos',
        difficulty: 'iniciante',
        scenario: 'A loja filtra produtos por categoria e só mostra itens com released = 1. Existem itens internos com released = 0.',
        goal: 'Faça a busca revelar pelo menos um produto não lançado (oculto).',
        template: "SELECT id, name, category, price FROM products WHERE released = 1 AND category = '__INPUT__'",
        templateLabel: '... WHERE released = 1 AND category = \'SUA_ENTRADA\'',
        starter: 'Gifts',
        success: (result) => rowsContain(result, ['cupom', 'protótipo', 'prototipo', 'licença', 'licenca']),
        solution: "Gifts' OR 1=1 -- ",
        debrief: 'Sua condição OR tornou o WHERE inteiro verdadeiro, anulando o filtro released = 1. O banco devolveu até os produtos internos. Defesa: prepared statement com parâmetro ligado, não concatenação.',
      },
      {
        kind: 'sql',
        id: 'sqli-union',
        title: 'Roubando credenciais com UNION',
        difficulty: 'fácil',
        scenario: 'A mesma busca de produtos retorna 4 colunas (id, name, category, price). Existe uma tabela users(id, username, password, role).',
        goal: 'Extraia a senha do usuário admin na resposta da busca de produtos.',
        template: "SELECT id, name, category, price FROM products WHERE released = 1 AND category = '__INPUT__'",
        templateLabel: '... WHERE released = 1 AND category = \'SUA_ENTRADA\'',
        starter: "Gifts' UNION SELECT id, name, category, price FROM products -- ",
        success: (result) => rowsContain(result, ['s3cr3t_adm1n']),
        solution: "x' UNION SELECT username, password, role, id FROM users -- ",
        debrief: 'O UNION exige o MESMO número de colunas. Você alinhou username/password no lugar de name/category e o banco colou os dados da tabela users na resposta de produtos. Foi assim que a senha do admin vazou.',
      },
      {
        kind: 'sql',
        id: 'sqli-login',
        title: 'Login sem senha',
        difficulty: 'fácil',
        scenario: 'O login monta: WHERE username = \'ENTRADA\' AND password = \'senha-digitada\'. Você não sabe a senha do admin.',
        goal: 'Autentique-se como admin sem conhecer a senha.',
        template: "SELECT id, username, role FROM users WHERE username = '__INPUT__' AND password = 'senha-errada'",
        templateLabel: '... WHERE username = \'SUA_ENTRADA\' AND password = \'senha-errada\'',
        starter: 'admin',
        success: (result) => result.rows.length > 0 && rowsContain(result, ['admin']),
        solution: "admin' -- ",
        debrief: 'O comentário -- descartou a checagem de senha inteira. A query virou "WHERE username = \'admin\'" e o banco autenticou você como admin. Por isso login nunca deve ser montado com concatenação.',
      },
    ],
    quiz: [
      {
        id: 'q-sqli-union',
        prompt: 'Um UNION SELECT falha com "número de colunas diferente". O que fazer?',
        options: [
          'Ajustar o SELECT para ter o mesmo número de colunas da query original',
          'Usar aspas duplas',
          'Trocar para método POST',
          'Adicionar mais OR',
        ],
        answer: 0,
        explanation: 'UNION exige que os dois SELECTs tenham a mesma quantidade de colunas. Você descobre o número testando (ORDER BY n / UNION SELECT NULL,NULL,...).',
      },
      {
        id: 'q-sqli-fix',
        prompt: 'Qual é a defesa REAL contra SQL injection?',
        options: [
          'Remover aspas da entrada',
          'Consultas parametrizadas (prepared statements)',
          'Esconder mensagens de erro',
          'Usar HTTPS',
        ],
        answer: 1,
        explanation: 'Prepared statements separam código de dado: a entrada nunca é interpretada como SQL. Filtrar aspas manualmente é frágil e contornável.',
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    id: 'xss',
    title: 'Cross-Site Scripting',
    tagline: 'Injetar JavaScript que roda no navegador da vítima.',
    icon: 'Code2',
    difficulty: 'fácil',
    technique: 'Cross-site Scripting',
    requires: ['fundamentos'],
    lessons: [
      {
        id: 'xss-basics',
        title: 'Os três contextos do XSS',
        minutes: 7,
        body: [
          'XSS acontece quando a aplicação coloca sua entrada numa página SEM neutralizar os caracteres que mudam o significado do HTML. Seu texto deixa de ser conteúdo e vira código executável.',
          'O que decide o payload é o CONTEXTO onde a entrada cai: 1) Contexto HTML (dentro de uma <div>): use uma tag própria, ex.: <img src=x onerror=alert(1)> ou <script>alert(1)</script>. 2) Contexto de atributo (dentro de value="..."): primeiro feche o atributo/tag com "> e depois injete. 3) Contexto JavaScript (dentro de <script>): feche a string e o statement.',
          'Nos labs o XSS é EXECUTADO de verdade num iframe isolado. Quando seu payload disparar um alert, o lab detecta a execução real — exatamente como uma prova de conceito em report.',
        ],
        keyPoints: [
          'Identifique o contexto antes de escolher o payload.',
          'Em atributo, comece fechando: "> ou \'>',
          'Refletido (na resposta imediata) vs. Armazenado (salvo e servido a outros) vs. DOM (no JS do cliente).',
          'Defesa: codificação de saída por contexto + CSP.',
        ],
      },
    ],
    labs: [
      {
        kind: 'xss',
        id: 'xss-html',
        title: 'Comentário refletido (contexto HTML)',
        difficulty: 'iniciante',
        scenario: 'O site mostra seu comentário direto dentro de uma <div>, sem sanitizar.',
        goal: 'Execute JavaScript (dispare um alert) injetando uma tag.',
        context: 'html',
        template: '<div class="comment">Comentário: __INPUT__</div>',
        templateLabel: '<div class="comment">Comentário: SUA_ENTRADA</div>',
        starter: 'Adorei o produto!',
        solution: '<img src=x onerror=alert(1)>',
        debrief: 'Sua entrada caiu em contexto HTML sem codificação, então a tag <img> foi parseada e o handler onerror executou. Defesa: codificar < > & ao renderizar conteúdo do usuário.',
      },
      {
        kind: 'xss',
        id: 'xss-attribute',
        title: 'Campo de busca (contexto de atributo)',
        difficulty: 'fácil',
        scenario: 'O termo buscado é refletido dentro do atributo value de um <input>.',
        goal: 'Escape do atributo e execute JavaScript.',
        context: 'attribute',
        template: '<input type="text" value="__INPUT__" class="search">',
        templateLabel: '<input value="SUA_ENTRADA">',
        starter: 'celular',
        solution: '"><img src=x onerror=alert(1)>',
        debrief: 'Você fechou o atributo e a tag com "> e então injetou sua própria tag. Sem fechar o contexto primeiro, o payload ficaria preso dentro do value. Defesa: codificar aspas no contexto de atributo.',
      },
    ],
    quiz: [
      {
        id: 'q-xss-context',
        prompt: 'Sua entrada é refletida dentro de value="AQUI". Qual o primeiro passo do payload?',
        options: ['Adicionar <script> direto', 'Fechar o atributo com "> antes de injetar', 'Usar OR 1=1', 'Codificar em base64'],
        answer: 1,
        explanation: 'Em contexto de atributo você precisa primeiro sair dele com "> para então abrir uma tag executável.',
      },
      {
        id: 'q-xss-type',
        prompt: 'Um XSS que é salvo no servidor e servido a TODOS que visitam a página é do tipo:',
        options: ['Refletido', 'Armazenado (stored)', 'DOM-based', 'Blind apenas'],
        answer: 1,
        explanation: 'Stored XSS persiste no servidor e atinge todos os visitantes — geralmente o de maior impacto e maior bounty.',
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    id: 'ssrf',
    title: 'SSRF & Superfícies Internas',
    tagline: 'Fazer o servidor bater em alvos que você não alcança.',
    icon: 'Server',
    difficulty: 'médio',
    technique: 'SSRF',
    requires: ['access-control', 'sqli'],
    lessons: [
      {
        id: 'ssrf-basics',
        title: 'SSRF: o servidor como seu proxy',
        minutes: 6,
        body: [
          'SSRF (Server-Side Request Forgery) acontece quando você consegue fazer o servidor da aplicação enviar uma requisição para uma URL que você controla — incluindo endereços internos que normalmente seriam inacessíveis (127.0.0.1, metadados de cloud em 169.254.169.254, serviços internos).',
          'Validações ingênuas só checam a primeira URL. Um bypass comum é fornecer uma URL externa que REDIRECIONA para o destino interno, ou usar representações alternativas do IP.',
          'Impacto típico: ler metadados de cloud (credenciais!), escanear a rede interna ou atingir painéis administrativos que confiam em "veio de dentro".',
        ],
        keyPoints: [
          'Alvos clássicos: 127.0.0.1, 169.254.169.254, serviços internos.',
          'Bypass por redirect: a 1ª URL é externa, a final é interna.',
          'Defesa: validar host/IP/protocolo APÓS cada redirect, allowlist.',
        ],
      },
    ],
    labs: [
      {
        kind: 'challenge',
        id: 'ssrf-webhook',
        title: 'Validador de webhook',
        difficulty: 'médio',
        scenario: 'O validador aceita só HTTPS na primeira URL, mas segue redirects sem revalidar o destino final.',
        goal: 'Faça o servidor seguir um redirect controlado até o serviço interno (127.0.0.1).',
        starter: `POST /api/webhooks/test HTTP/1.1
Host: lab.shellnotes.local
Content-Type: application/json

{ "url": "https://webhook.example/ping" }`,
        expected: ['redirect', '127.0.0.1'],
        successResponse: `HTTP/1.1 200 OK

{ "initial_host": "redirect.lab", "final_url": "http://127.0.0.1:8080/health", "body": "internal-service-ok" }`,
        failureResponse: `HTTP/1.1 200 OK

{ "initial_host": "webhook.example", "redirects": 0, "body": "pong" }`,
        solution: 'No JSON: { "url": "https://redirect.lab/?to=http://127.0.0.1:8080/health" }',
        debrief: 'A aplicação validou só o primeiro destino. Um cliente HTTP seguro precisa revalidar host, IP e protocolo após CADA redirect.',
      },
    ],
    quiz: [
      {
        id: 'q-ssrf-target',
        prompt: 'Qual endereço costuma ser o alvo de maior impacto num SSRF em ambiente de cloud?',
        options: ['8.8.8.8', '169.254.169.254 (metadados)', 'google.com', '255.255.255.255'],
        answer: 1,
        explanation: 'O endpoint de metadados (169.254.169.254) pode expor credenciais temporárias da instância — escalada direta.',
      },
    ],
  },
];

export function moduleById(id: string): Module | undefined {
  return CURRICULUM.find((module) => module.id === id);
}

export function allLabs(): Lab[] {
  return CURRICULUM.flatMap((module) => module.labs);
}

export function countLabs(): number {
  return allLabs().length;
}

export function countQuizzes(): number {
  return CURRICULUM.reduce((sum, module) => sum + module.quiz.length, 0);
}

export function countLessons(): number {
  return CURRICULUM.reduce((sum, module) => sum + module.lessons.length, 0);
}
