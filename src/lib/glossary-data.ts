export type GlossaryTerm = {
  term: string;
  abbr: string;
  def: string;
};

export const glossaryTerms: GlossaryTerm[] = [
  { term: 'Beacon', abbr: '', def: 'Implante de C2 que “liga de volta” ao operador em intervalos definidos, em vez de manter conexão aberta.' },
  { term: 'BloodHound', abbr: '', def: 'Ferramenta que mapeia relações em Active Directory como grafo para achar caminhos até Domain Admin.' },
  { term: 'Buffer Overflow', abbr: 'BOF', def: 'Escrita além do limite de um buffer que sobrescreve memória adjacente e pode desviar o fluxo de execução.' },
  { term: 'Coerção', abbr: '', def: 'Forçar uma máquina a se autenticar contra um host controlado pelo atacante, base de muitos ataques de relay.' },
  { term: 'CVE', abbr: 'Common Vulnerabilities and Exposures', def: 'Identificador público e único para uma vulnerabilidade específica de software.' },
  { term: 'Enumeração', abbr: '', def: 'Coleta metódica de informação sobre o alvo — serviços, usuários, shares — antes de explorar qualquer falha.' },
  { term: 'Hash', abbr: '', def: 'Resumo de tamanho fixo de uma entrada; em segurança, a forma como senhas são armazenadas e atacadas offline.' },
  { term: 'Kerberoasting', abbr: '', def: 'Pedir tickets de serviço no Kerberos para quebrar offline a senha de contas de serviço do domínio.' },
  { term: 'LFI', abbr: 'Local File Inclusion', def: 'Falha web que faz a aplicação incluir arquivos locais do servidor a partir de entrada do usuário.' },
  { term: 'Lateral Movement', abbr: '', def: 'Saltar de um host comprometido para outro dentro da rede, expandindo o acesso sem tocar o perímetro de novo.' },
  { term: 'NTLM', abbr: '', def: 'Protocolo de autenticação legado da Microsoft, alvo frequente de ataques de relay e pass-the-hash.' },
  { term: 'Pass-the-Hash', abbr: 'PtH', def: 'Autenticar usando o hash NTLM de uma senha, sem nunca precisar conhecer a senha em texto claro.' },
  { term: 'Payload', abbr: '', def: 'A parte do exploit que executa a ação desejada pelo atacante após a falha ser disparada.' },
  { term: 'Pivoting', abbr: '', def: 'Usar um host comprometido como ponte para alcançar redes que não eram acessíveis diretamente.' },
  { term: 'Privilege Escalation', abbr: 'privesc', def: 'Subir de um acesso limitado para privilégios mais altos, como de usuário comum a root ou SYSTEM.' },
  { term: 'Recon', abbr: 'reconnaissance', def: 'Fase inicial de levantamento de informação sobre o alvo, ativa ou passiva.' },
  { term: 'Reverse Shell', abbr: '', def: 'Shell em que a máquina alvo inicia a conexão de volta para o atacante, contornando o firewall de entrada.' },
  { term: 'SSRF', abbr: 'Server-Side Request Forgery', def: 'Fazer o servidor emitir requisições para destinos escolhidos pelo atacante, alcançando recursos internos.' },
  { term: 'SQL Injection', abbr: 'SQLi', def: 'Injeção de SQL através de entrada não sanitizada, permitindo ler ou alterar o banco de dados.' },
  { term: 'TTP', abbr: 'Tactics, Techniques and Procedures', def: 'A descrição em camadas de como um adversário opera, do objetivo ao comando concreto.' },
  { term: 'WAF', abbr: 'Web Application Firewall', def: 'Filtro que inspeciona tráfego HTTP para bloquear ataques web conhecidos antes de chegarem à aplicação.' },
  { term: 'XSS', abbr: 'Cross-Site Scripting', def: 'Injeção de script que executa no navegador de outras vítimas no contexto do site vulnerável.' },
];
