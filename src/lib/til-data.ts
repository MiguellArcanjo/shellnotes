export type TilNote = {
  date: string;
  dateLabel: string;
  title: string;
  body: string;
  code: string;
  tags: string[];
};

export const tilNotes: TilNote[] = [
  {
    date: '2026-06-16', dateLabel: '16 jun 2026',
    title: 'nmap aceita CIDR e ranges no mesmo alvo',
    body: 'Sempre achei que precisava de arquivo de hosts para misturar formatos. Dá para passar tudo junto — sub-rede, range e host avulso — e o nmap resolve.',
    code: 'nmap 10.10.10.0/24 10.10.11.1-50 192.168.1.7',
    tags: ['recon', 'nmap'],
  },
  {
    date: '2026-06-13', dateLabel: '13 jun 2026',
    title: 'O bit SUID não vale nada se o binário dropa privilégio',
    body: 'Passei tempo demais num binário SUID que chamava setuid(getuid()) logo no começo. Vale checar com ltrace antes de assumir que o caminho de privesc existe.',
    code: 'ltrace -f ./suidbin 2>&1 | grep -i setuid',
    tags: ['privesc', 'linux'],
  },
  {
    date: '2026-06-10', dateLabel: '10 jun 2026',
    title: 'curl --resolve evita editar o /etc/hosts',
    body: 'Quando preciso bater num vhost que ainda não está no DNS, dá para forçar a resolução só naquela requisição, sem sujar o sistema.',
    code: 'curl --resolve app.target.htb:443:10.10.10.10 https://app.target.htb/',
    tags: ['web', 'curl'],
  },
  {
    date: '2026-06-07', dateLabel: '07 jun 2026',
    title: 'Responder e ntlmrelayx não podem disputar a porta 445',
    body: 'Se o relay não recebe nada, quase sempre é o SMB do próprio Responder segurando a porta. Desliga SMB e HTTP no Responder.conf antes de relayar.',
    code: '',
    tags: ['ad', 'relay'],
  },
  {
    date: '2026-06-04', dateLabel: '04 jun 2026',
    title: 'gobuster -x para extensões, sem refazer a wordlist',
    body: 'Em vez de gerar uma lista com .php/.txt já anexados, o próprio gobuster multiplica cada palavra pelas extensões que você passa.',
    code: 'gobuster dir -u http://10.10.10.10 -w common.txt -x php,txt,bak',
    tags: ['web', 'recon'],
  },
  {
    date: '2026-06-01', dateLabel: '01 jun 2026',
    title: 'O TTL ainda entrega o SO do host',
    body: 'Resposta com TTL perto de 64 quase sempre é Linux; perto de 128, Windows. Não é prova, mas é um palpite rápido e grátis durante o recon.',
    code: '',
    tags: ['recon', 'network'],
  },
  {
    date: '2026-05-29', dateLabel: '29 mai 2026',
    title: 'base64 -d no Windows é certutil',
    body: 'Sem coreutils, dá para decodificar payloads em base64 usando o certutil — útil quando você só tem um shell cmd cru.',
    code: 'certutil -decode payload.b64 payload.bin',
    tags: ['windows'],
  },
  {
    date: '2026-05-25', dateLabel: '25 mai 2026',
    title: 'JWT com alg:none ainda aparece em produção',
    body: 'Antes de partir para quebrar a chave, vale tentar o óbvio: remover a assinatura e trocar o header para "none". Muita lib aceita.',
    code: `echo -n '{"alg":"none","typ":"JWT"}' | base64 | tr -d '='`,
    tags: ['web', 'auth'],
  },
  {
    date: '2026-05-21', dateLabel: '21 mai 2026',
    title: 'stty raw -echo precisa do fg de volta',
    body: 'Ao estabilizar um shell, o passo que eu sempre esquecia é o "fg" depois de mandar o nc para background com Ctrl+Z — sem ele, o terminal trava.',
    code: 'Ctrl+Z; stty raw -echo; fg; reset',
    tags: ['shells', 'linux'],
  },
  {
    date: '2026-05-17', dateLabel: '17 mai 2026',
    title: 'crackmapexec marca a senha válida com [+]',
    body: 'Em spray de senhas em massa, dá para varrer só os sucessos no output — o CME prefixa as credenciais que funcionaram, então o grep resolve.',
    code: `crackmapexec smb hosts.txt -u users.txt -p 'Verao2026!' | grep '\\[+\\]'`,
    tags: ['ad', 'password'],
  },
];
