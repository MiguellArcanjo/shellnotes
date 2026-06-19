export type ChecklistTargetType = 'web' | 'api' | 'mobile' | 'ad';
export type ChecklistStage = 'recon' | 'enumeracao' | 'exploracao' | 'pos-exploracao';

export type ChecklistItem = {
  id: string;
  stage: ChecklistStage;
  text: string;
  checked: boolean;
};

export type Checklist = {
  id: string;
  title: string;
  targetType: ChecklistTargetType;
  // empty for a reusable template; set when this is a copy applied to a program/target
  programId: string;
  items: ChecklistItem[];
};

export const TARGET_TYPES: ChecklistTargetType[] = ['web', 'api', 'mobile', 'ad'];

export const TARGET_TYPE_LABELS: Record<ChecklistTargetType, string> = {
  web: 'web',
  api: 'API',
  mobile: 'mobile',
  ad: 'active directory',
};

export const STAGES: ChecklistStage[] = ['recon', 'enumeracao', 'exploracao', 'pos-exploracao'];

export const STAGE_LABELS: Record<ChecklistStage, string> = {
  recon: 'recon',
  enumeracao: 'enumeração',
  exploracao: 'exploração',
  'pos-exploracao': 'pós-exploração',
};

function item(id: string, stage: ChecklistStage, text: string): ChecklistItem {
  return { id, stage, text, checked: false };
}

export const checklists: Checklist[] = [
  {
    id: 'checklist-web',
    title: 'Web App — metodologia geral',
    targetType: 'web',
    programId: '',
    items: [
      item('web-1', 'recon', 'Mapear subdomínios com subfinder/amass'),
      item('web-2', 'recon', 'Identificar tecnologias com Wappalyzer/whatweb'),
      item('web-3', 'recon', 'Buscar arquivos sensíveis expostos (robots.txt, .git, .env)'),
      item('web-4', 'enumeracao', 'Spidering com Burp/ZAP para mapear endpoints'),
      item('web-5', 'enumeracao', 'Enumerar parâmetros com Arjun/ParamSpider'),
      item('web-6', 'enumeracao', 'Testar fluxos de cadastro, login e recuperação de senha'),
      item('web-7', 'exploracao', 'Testar IDOR em endpoints com identificadores previsíveis'),
      item('web-8', 'exploracao', 'Testar XSS refletido/armazenado nos campos de entrada'),
      item('web-9', 'exploracao', 'Testar SSRF em campos que aceitam URLs'),
      item('web-10', 'exploracao', 'Testar SQLi em parâmetros de busca/filtro'),
      item('web-11', 'pos-exploracao', 'Avaliar impacto e elaborar PoC reprodutível'),
      item('web-12', 'pos-exploracao', 'Verificar se a vulnerabilidade afeta outros usuários/tenants'),
      item('web-13', 'pos-exploracao', 'Documentar passos de reprodução para o report'),
    ],
  },
  {
    id: 'checklist-api',
    title: 'API — metodologia geral',
    targetType: 'api',
    programId: '',
    items: [
      item('api-1', 'recon', 'Coletar especificação (Swagger/OpenAPI) se pública'),
      item('api-2', 'recon', 'Identificar versões da API expostas (v1, v2...)'),
      item('api-3', 'enumeracao', 'Mapear todos os endpoints e métodos HTTP suportados'),
      item('api-4', 'enumeracao', 'Testar autenticação em cada endpoint (token ausente/expirado)'),
      item('api-5', 'exploracao', 'Testar BOLA/IDOR trocando IDs de recursos entre contas de teste'),
      item('api-6', 'exploracao', 'Testar mass assignment em payloads JSON'),
      item('api-7', 'exploracao', 'Testar rate limiting e abuso de endpoints sensíveis'),
      item('api-8', 'pos-exploracao', 'Confirmar o escopo do impacto (quantos recursos/usuários afetados)'),
      item('api-9', 'pos-exploracao', 'Registrar request/response completos como evidência'),
    ],
  },
  {
    id: 'checklist-mobile',
    title: 'Mobile — metodologia geral',
    targetType: 'mobile',
    programId: '',
    items: [
      item('mob-1', 'recon', 'Baixar o APK/IPA público e extrair com apktool/jadx'),
      item('mob-2', 'recon', 'Buscar segredos hardcoded no binário (chaves de API, URLs internas)'),
      item('mob-3', 'enumeracao', 'Mapear tráfego com proxy (Burp + certificado confiável no device)'),
      item('mob-4', 'enumeracao', 'Identificar endpoints de API consumidos pelo app'),
      item('mob-5', 'exploracao', 'Testar bypass de certificate pinning'),
      item('mob-6', 'exploracao', 'Testar manipulação de requests para endpoints de backend'),
      item('mob-7', 'exploracao', 'Testar armazenamento inseguro de dados sensíveis no device'),
      item('mob-8', 'pos-exploracao', 'Validar se o problema existe na última versão publicada'),
      item('mob-9', 'pos-exploracao', 'Capturar evidências (logs, screenshots, request/response)'),
    ],
  },
  {
    id: 'checklist-ad',
    title: 'Active Directory — metodologia geral',
    targetType: 'ad',
    programId: '',
    items: [
      item('ad-1', 'recon', 'Enumerar usuários e grupos via LDAP anônimo, se permitido'),
      item('ad-2', 'recon', 'Identificar controladores de domínio e relações de confiança'),
      item('ad-3', 'enumeracao', 'Enumerar shares de rede acessíveis (SMB) e permissões'),
      item('ad-4', 'enumeracao', 'Buscar contas com SPN para Kerberoasting'),
      item('ad-5', 'exploracao', 'Tentar Kerberoasting / AS-REP Roasting em contas vulneráveis'),
      item('ad-6', 'exploracao', 'Testar relay de NTLM em serviços sem assinatura SMB'),
      item('ad-7', 'exploracao', 'Verificar caminhos de escalonamento via BloodHound'),
      item('ad-8', 'pos-exploracao', 'Documentar o caminho de comprometimento até Domain Admin'),
      item('ad-9', 'pos-exploracao', 'Verificar se as credenciais obtidas são reutilizáveis (password reuse)'),
    ],
  },
];

export function getChecklist(id: string): Checklist | undefined {
  return checklists.find((c) => c.id === id);
}

export function createBlankChecklist(id: string): Checklist {
  return {
    id,
    title: '',
    targetType: 'web',
    programId: '',
    items: [],
  };
}

export function cloneChecklistForProgram(template: Checklist, programId: string, newId: string): Checklist {
  return {
    id: newId,
    title: template.title,
    targetType: template.targetType,
    programId,
    items: template.items.map((sourceItem, index) => ({
      ...sourceItem,
      id: `${newId}-i${index}`,
      checked: false,
    })),
  };
}

export function checklistProgress(checklist: Checklist): { checked: number; total: number } {
  return {
    checked: checklist.items.filter((i) => i.checked).length,
    total: checklist.items.length,
  };
}
