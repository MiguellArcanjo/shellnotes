# ShellNotes - Painel Administrativo

Painel de gerenciamento de conteúdo privado para writeups, cheatsheets, TILs, CVEs e glossário técnico.

## 🎨 Design System

### Tema Claro
- Background: `#FBFBF9`
- Texto: `#1A1A17`
- Secundário: `#76746C`
- Linhas: `#E7E6E0`
- Acento: `#3E7A5E`

### Tema Escuro
- Background: `#161514`
- Texto: `#ECEAE3`
- Secundário: `#9A978D`
- Linhas: `#2A2926`
- Acento: `#6BB88F`

### Tipografia
- Fonte: **Inter** (Google Fonts)

## 🚀 Tecnologias

- **Next.js 16** - Framework React com App Router
- **React 19** - Biblioteca UI
- **TypeScript 5** - Tipagem estática
- **Tailwind CSS 4** - Framework CSS
- **Lucide React** - Ícones

## 📁 Estrutura

```
src/
├── app/
│   ├── admin/           # Painel administrativo
│   │   ├── layout.tsx   # Layout do admin
│   │   ├── page.tsx     # Dashboard
│   │   ├── writeups/    # Gestão de writeups
│   │   ├── cheatsheets/ # Gestão de cheatsheets
│   │   ├── til/         # Gestão de TILs
│   │   ├── cves/        # Gestão de CVEs
│   │   └── glossary/    # Gestão de glossário
│   ├── layout.tsx       # Layout raiz
│   ├── page.tsx         # Página inicial
│   └── globals.css      # Estilos globais
├── components/
│   └── admin/
│       ├── AdminSidebar.tsx    # Navegação lateral
│       ├── AdminHeader.tsx     # Cabeçalho com tema
│       └── ContentTable.tsx    # Tabela reutilizável
├── types/
│   └── content.ts       # Tipos TypeScript
└── styles/
    └── theme.ts         # Configuração de tema

```

## 🎯 Funcionalidades

### Dashboard
- Visão geral de estatísticas
- Atividade recente
- Acesso rápido às seções

### Gestão de Conteúdo
Cada seção (Writeups, Cheatsheets, TIL, CVEs, Glossário) possui:

- ✅ Listagem com busca
- ✅ Filtros por título e tags
- ✅ Status (Rascunho/Publicado)
- ✅ Ações de editar e excluir
- ✅ Botão destacado para criar novo
- ✅ Indicador de área privada

### Navegação
- Sidebar com navegação entre seções
- Link externo para área de Bug Bounty
- Indicador visual de área privada
- Alternância de tema claro/escuro

## 🛠️ Desenvolvimento

### Instalar dependências
```bash
npm install
```

### Executar em desenvolvimento
```bash
npm run dev
```

Acesse: `http://localhost:3000`

### Build para produção
```bash
npm run build
npm start
```

### Lint
```bash
npm run lint
```

## 📋 Próximos Passos

- [ ] Implementar autenticação (login)
- [ ] Criar formulários de edição
- [ ] Adicionar editor Markdown
- [ ] Implementar API Routes
- [ ] Conectar banco de dados
- [ ] Sistema de upload de imagens
- [ ] Exportação de conteúdo
- [ ] Sistema de tags dinâmico
- [ ] Busca avançada
- [ ] Versionamento de conteúdo

## 🔒 Segurança

Este é um painel administrativo privado. Certifique-se de:
- Implementar autenticação robusta
- Usar variáveis de ambiente para segredos
- Proteger rotas administrativas
- Validar entrada de usuários
- Implementar CSRF protection

## 📝 Licença

Projeto privado - Todos os direitos reservados