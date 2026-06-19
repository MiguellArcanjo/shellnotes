'use client';

import Link from 'next/link';
import {
  Bold,
  CheckSquare,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  PanelTopOpen,
  Quote,
  ShieldAlert,
  Sparkles,
  Strikethrough,
  Table2,
  TextQuote,
  type LucideIcon,
} from 'lucide-react';
import {
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ChipInput from '@/components/site/ChipInput';
import { DIFFICULTIES, formatDateLabel, PLATFORMS, SYSTEMS, type Writeup } from '@/lib/writeups-data';
import { saveOverride } from '@/lib/writeupOverrides';
import { uploadContentFile } from '@/lib/supabase/storage';
import WriteupBody from './WriteupBody';
import styles from './Writeups.module.css';

type ViewMode = 'editar' | 'dividir' | 'previa';

type EditorCommand = {
  id: string;
  label: string;
  description: string;
  keywords: string;
  icon: LucideIcon;
  template?: string;
  action?: 'image';
};

type SlashState = {
  start: number;
  end: number;
  query: string;
};

const AUTOSAVE_DELAY_MS = 1200;
const DEFAULT_SELECTION = 'texto';

const COMMANDS: EditorCommand[] = [
  { id: 'h1', label: 'Título 1', description: 'Título principal da seção', keywords: 'h1 heading titulo', icon: Heading1, template: '# {{selection}}' },
  { id: 'h2', label: 'Título 2', description: 'Título de seção', keywords: 'h2 heading titulo', icon: Heading2, template: '## {{selection}}' },
  { id: 'h3', label: 'Título 3', description: 'Subtítulo de seção', keywords: 'h3 heading titulo', icon: Heading3, template: '### {{selection}}' },
  { id: 'bold', label: 'Negrito', description: 'Destaca o texto selecionado', keywords: 'bold forte negrito', icon: Bold, template: '**{{selection}}**' },
  { id: 'italic', label: 'Itálico', description: 'Aplica ênfase ao texto', keywords: 'italic enfase italico', icon: Italic, template: '*{{selection}}*' },
  { id: 'strike', label: 'Tachado', description: 'Marca texto como removido', keywords: 'strike tachado riscado', icon: Strikethrough, template: '~~{{selection}}~~' },
  { id: 'inline-code', label: 'Código inline', description: 'Código dentro de uma frase', keywords: 'inline code codigo', icon: Code2, template: '`{{selection}}`' },
  { id: 'highlight', label: 'Realce', description: 'Realça um trecho importante', keywords: 'highlight mark realce', icon: Highlighter, template: '=={{selection}}==' },
  { id: 'bullet-list', label: 'Lista com marcador', description: 'Cria uma lista simples', keywords: 'bullet lista marcador', icon: List, template: '- {{selection}}' },
  { id: 'ordered-list', label: 'Lista numerada', description: 'Cria uma lista ordenada', keywords: 'ordered numerada lista', icon: ListOrdered, template: '1. {{selection}}' },
  { id: 'task-list', label: 'Lista de tarefas', description: 'Cria um checkbox', keywords: 'task checkbox tarefa', icon: CheckSquare, template: '- [ ] {{selection}}' },
  { id: 'quote', label: 'Citação', description: 'Insere um blockquote', keywords: 'quote citacao blockquote', icon: Quote, template: '> {{selection}}' },
  { id: 'note', label: 'Callout: nota', description: 'Caixa de anotação', keywords: 'callout note nota', icon: TextQuote, template: '> [!note] Nota\n> {{selection}}' },
  { id: 'tip', label: 'Callout: dica', description: 'Caixa de recomendação', keywords: 'callout tip dica', icon: Sparkles, template: '> [!tip] Dica\n> {{selection}}' },
  { id: 'warning', label: 'Callout: atenção', description: 'Caixa de alerta', keywords: 'callout warning atencao alerta', icon: ShieldAlert, template: '> [!warning] Atenção\n> {{selection}}' },
  { id: 'danger', label: 'Callout: perigo', description: 'Caixa de risco crítico', keywords: 'callout danger perigo critico', icon: ShieldAlert, template: '> [!danger] Perigo\n> {{selection}}' },
  { id: 'info', label: 'Callout: informação', description: 'Caixa informativa', keywords: 'callout info informacao', icon: TextQuote, template: '> [!info] Informação\n> {{selection}}' },
  { id: 'code', label: 'Bloco de código', description: 'Código com linguagem e botão copiar', keywords: 'code codigo fence bash', icon: Code2, template: '```bash\n{{selection}}\n```' },
  { id: 'table', label: 'Tabela', description: 'Tabela com duas colunas', keywords: 'table tabela colunas', icon: Table2, template: '| Coluna 1 | Coluna 2 |\n| --- | --- |\n| {{selection}} | Valor |' },
  { id: 'link', label: 'Link', description: 'Link para uma URL', keywords: 'link url externo', icon: Link2, template: '[{{selection}}](https://)' },
  { id: 'wikilink', label: 'Wikilink', description: 'Referência a outro writeup', keywords: 'wiki link interno writeup', icon: Link2, template: '[[{{selection}}]]' },
  { id: 'details', label: 'Seção recolhível', description: 'Conteúdo em toggle/details', keywords: 'details toggle recolhivel secao', icon: PanelTopOpen, template: ':::details Ver detalhes\n{{selection}}\n:::' },
  { id: 'rule', label: 'Régua horizontal', description: 'Separa visualmente as seções', keywords: 'rule hr regua divisor', icon: Minus, template: '---' },
  { id: 'flag', label: 'Flag com spoiler', description: 'Bloco protegido para a flag', keywords: 'flag spoiler ctf', icon: ShieldAlert, template: ':::flag\n{{selection}}\n:::' },
  { id: 'image', label: 'Imagem', description: 'Envia e insere uma imagem', keywords: 'image imagem upload foto', icon: ImageIcon, action: 'image' },
];

function formatSavedLabel(savedAt: number | null, now: number): string {
  if (savedAt === null) return '';
  const diffMs = now - savedAt;
  if (diffMs < 60_000) return 'salvo há instantes';
  const minutes = Math.floor(diffMs / 60_000);
  return minutes === 1 ? 'salvo há 1 min' : `salvo há ${minutes} min`;
}

export default function WriteupEditor({
  writeup,
  isNew = false,
  onExit,
  backHref = '/writeups',
}: {
  writeup: Writeup;
  isNew?: boolean;
  onExit: (updated: Writeup) => void;
  backHref?: string;
}) {
  const [draft, setDraft] = useState<Writeup>(writeup);
  const [viewMode, setViewMode] = useState<ViewMode>('editar');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [slashState, setSlashState] = useState<SlashState | null>(null);
  const [activeCommand, setActiveCommand] = useState(0);
  const [codeLanguage, setCodeLanguage] = useState('bash');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selectionRef = useRef({ start: 0, end: 0 });
  const hasPersisted = useRef(!isNew);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  const persist = (data: Writeup) => {
    hasPersisted.current = true;
    void saveOverride(data.slug, data);
    setSavedAt(Date.now());
  };

  useEffect(() => {
    if (!hasPersisted.current) return;
    const id = setTimeout(() => persist(draft), AUTOSAVE_DELAY_MS);
    return () => clearTimeout(id);
  }, [draft]);

  const update = (patch: Partial<Writeup>) => setDraft((current) => ({ ...current, ...patch }));

  const filteredCommands = useMemo(() => {
    const query = slashState?.query.trim().toLowerCase() ?? '';
    if (!query) return COMMANDS;
    return COMMANDS.filter((command) =>
      `${command.label} ${command.keywords}`.toLowerCase().includes(query),
    );
  }, [slashState?.query]);

  const focusSelection = (start: number, end = start) => {
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(start, end);
      selectionRef.current = { start, end };
    });
  };

  const applyTemplate = (
    template: string,
    replaceRange?: { start: number; end: number },
  ) => {
    const textarea = textareaRef.current;
    const start = replaceRange?.start ?? textarea?.selectionStart ?? selectionRef.current.start;
    const end = replaceRange?.end ?? textarea?.selectionEnd ?? selectionRef.current.end;
    const selected = replaceRange ? '' : draft.content.slice(start, end);
    const placeholder = selected || DEFAULT_SELECTION;
    const markerIndex = template.indexOf('{{selection}}');
    const insertion = template.replace('{{selection}}', placeholder);
    const needsLeadingBreak = start > 0 && draft.content[start - 1] !== '\n' && insertion.includes('\n');
    const prefix = needsLeadingBreak ? '\n' : '';
    const next = draft.content.slice(0, start) + prefix + insertion + draft.content.slice(end);
    update({ content: next });
    setSlashState(null);

    if (markerIndex >= 0) {
      const selectionStart = start + prefix.length + markerIndex;
      focusSelection(selectionStart, selectionStart + placeholder.length);
    } else {
      focusSelection(start + prefix.length + insertion.length);
    }
  };

  const executeCommand = (command: EditorCommand) => {
    if (command.action === 'image') {
      setSlashState(null);
      fileInputRef.current?.click();
      return;
    }
    if (!command.template) return;
    applyTemplate(
      command.id === 'code'
        ? command.template.replace('```bash', `\`\`\`${codeLanguage}`)
        : command.template,
      slashState ? { start: slashState.start, end: slashState.end } : undefined,
    );
  };

  const commandById = (id: string) => COMMANDS.find((command) => command.id === id)!;

  const handleContentChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const content = event.target.value;
    const cursor = event.target.selectionStart;
    selectionRef.current = { start: cursor, end: cursor };
    update({ content });

    const lineStart = content.lastIndexOf('\n', cursor - 1) + 1;
    const typed = content.slice(lineStart, cursor);
    const slashMatch = /^\/([^\s/]*)$/.exec(typed);
    if (slashMatch) {
      setActiveCommand(0);
      setSlashState({ start: lineStart, end: cursor, query: slashMatch[1] });
    } else {
      setSlashState(null);
    }
  };

  const handleEditorKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!slashState) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      setSlashState(null);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (filteredCommands.length === 0) return;
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setActiveCommand((current) =>
        (current + direction + filteredCommands.length) % filteredCommands.length,
      );
      return;
    }
    if (event.key === 'Enter' && filteredCommands[activeCommand]) {
      event.preventDefault();
      executeCommand(filteredCommands[activeCommand]);
    }
  };

  const handleToolbarMouseDown = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const handleSave = () => persist(draft);

  const handlePublish = () => {
    const next: Writeup = { ...draft, status: 'published' };
    setDraft(next);
    persist(next);
  };

  const handleExit = () => {
    if (hasPersisted.current) void saveOverride(draft.slug, draft);
    onExit(draft);
  };

  const handleImageSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const url = await uploadContentFile(file, `writeups/${draft.slug}`);
      const { start, end } = selectionRef.current;
      applyTemplate(`![${file.name}](${url})`, { start, end });
    } catch {
      window.alert('Não foi possível enviar a imagem para o Storage.');
    }
  };

  const savedLabel = formatSavedLabel(savedAt, now);
  const inlineToolbar = [
    ['bold', 'Negrito'],
    ['italic', 'Itálico'],
    ['strike', 'Tachado'],
    ['inline-code', 'Código inline'],
    ['highlight', 'Realce'],
  ] as const;

  const slashMenu = slashState && (
    <div className={styles.slashMenu} role="listbox" aria-label="Comandos de formatação">
      <div className={styles.slashMenuHeader}>
        inserir bloco
        <span>{filteredCommands.length} opções</span>
      </div>
      <div className={styles.slashMenuList}>
        {filteredCommands.map((command, index) => {
          const Icon = command.icon;
          return (
            <button
              key={command.id}
              type="button"
              role="option"
              aria-selected={index === activeCommand}
              className={index === activeCommand ? styles.slashCommandActive : styles.slashCommand}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveCommand(index)}
              onClick={() => executeCommand(command)}
            >
              <span className={styles.slashCommandIcon}><Icon size={16} /></span>
              <span>
                <strong>{command.label}</strong>
                <small>{command.description}</small>
              </span>
            </button>
          );
        })}
        {filteredCommands.length === 0 && (
          <div className={styles.slashEmpty}>Nenhum bloco encontrado.</div>
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.editor}>
      <div className={styles.editorTopBar}>
        <div className={styles.breadcrumb}>
          <Link href={backHref} className={styles.breadcrumbLink}>writeups</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>{draft.title || 'sem título'}</span>
          <button type="button" onClick={handleExit} className={styles.closeEditButton}>
            voltar ao painel
          </button>
        </div>

        <div className={styles.topBarRight}>
          <span className={draft.status === 'published' ? styles.statusBadgePublished : styles.statusBadgeDraft}>
            {draft.status === 'published' ? 'publicado' : 'rascunho'}
          </span>
          <div className={styles.viewToggleGroup}>
            {(['editar', 'dividir', 'previa'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={viewMode === mode ? styles.viewToggleActive : styles.viewToggleInactive}
              >
                {mode === 'previa' ? 'prévia' : mode}
              </button>
            ))}
          </div>
          <span className={styles.autosaveLabel}>{savedLabel}</span>
          <button type="button" onClick={handleSave} className={styles.saveButton}>salvar</button>
          <button type="button" onClick={handlePublish} className={styles.publishButton}>publicar</button>
        </div>
      </div>

      <input
        type="text"
        value={draft.title}
        onChange={(event) => update({ title: event.target.value })}
        placeholder="Título do writeup"
        className={styles.titleField}
      />

      <div className={styles.metadataPanel}>
        <label className={styles.metadataField}>
          <span className={styles.metadataLabel}>plataforma</span>
          <select value={draft.platform} onChange={(event) => update({ platform: event.target.value })} className={styles.metadataSelect}>
            {PLATFORMS.map((platform) => <option key={platform} value={platform}>{platform}</option>)}
          </select>
        </label>
        <label className={styles.metadataField}>
          <span className={styles.metadataLabel}>dificuldade</span>
          <select value={draft.difficulty} onChange={(event) => update({ difficulty: event.target.value })} className={styles.metadataSelect}>
            {DIFFICULTIES.map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty}</option>)}
          </select>
        </label>
        <label className={styles.metadataField}>
          <span className={styles.metadataLabel}>os</span>
          <select value={draft.os} onChange={(event) => update({ os: event.target.value })} className={styles.metadataSelect}>
            {SYSTEMS.map((system) => <option key={system} value={system}>{system}</option>)}
          </select>
        </label>
        <label className={styles.metadataField}>
          <span className={styles.metadataLabel}>data</span>
          <input
            type="date"
            value={draft.date}
            onChange={(event) => update({ date: event.target.value, dateLabel: formatDateLabel(event.target.value) })}
            className={styles.metadataInput}
          />
        </label>
        <div className={styles.metadataField}>
          <span className={styles.metadataLabel}>slug</span>
          <span className={styles.slugDisplay}>{draft.slug}</span>
        </div>
        <div className={styles.metadataFieldWide}>
          <span className={styles.metadataLabel}>tags</span>
          <ChipInput values={draft.tags} onChange={(tags) => update({ tags })} placeholder="adicionar tag…" />
        </div>
        <div className={styles.metadataFieldWide}>
          <span className={styles.metadataLabel}>técnicas mitre att&amp;ck</span>
          <ChipInput
            values={draft.mitre}
            onChange={(mitre) => update({ mitre })}
            placeholder="ex: T1190 - Exploit Public-Facing Application"
            monospace
          />
        </div>
      </div>

      <div className={styles.editorToolbar} hidden={viewMode === 'previa'}>
        <div className={styles.toolbarGroup}>
          {(['h1', 'h2', 'h3'] as const).map((id) => {
            const command = commandById(id);
            const Icon = command.icon;
            return (
              <button
                key={id}
                type="button"
                title={command.label}
                aria-label={command.label}
                onMouseDown={handleToolbarMouseDown}
                onClick={() => executeCommand(command)}
                className={styles.toolbarIconButton}
              >
                <Icon size={15} />
              </button>
            );
          })}
        </div>
        <div className={styles.toolbarGroup}>
          {inlineToolbar.map(([id, label]) => {
            const command = commandById(id);
            const Icon = command.icon;
            return (
              <button
                key={id}
                type="button"
                title={label}
                aria-label={label}
                onMouseDown={handleToolbarMouseDown}
                onClick={() => executeCommand(command)}
                className={styles.toolbarIconButton}
              >
                <Icon size={15} />
              </button>
            );
          })}
        </div>
        <div className={styles.toolbarGroup}>
          {(['bullet-list', 'ordered-list', 'task-list', 'quote'] as const).map((id) => {
            const command = commandById(id);
            const Icon = command.icon;
            return (
              <button
                key={id}
                type="button"
                title={command.label}
                aria-label={command.label}
                onMouseDown={handleToolbarMouseDown}
                onClick={() => executeCommand(command)}
                className={styles.toolbarIconButton}
              >
                <Icon size={15} />
              </button>
            );
          })}
        </div>
        <div className={styles.toolbarGroup}>
          <select
            value={codeLanguage}
            onChange={(event) => setCodeLanguage(event.target.value)}
            className={styles.languageSelect}
            aria-label="Linguagem do bloco de código"
          >
            {['bash', 'javascript', 'typescript', 'python', 'sql', 'json', 'yaml', 'csharp', 'go', 'text'].map((language) => (
              <option key={language} value={language}>{language}</option>
            ))}
          </select>
          <button
            type="button"
            onMouseDown={handleToolbarMouseDown}
            onClick={() => executeCommand(commandById('code'))}
            className={styles.toolbarButton}
          >
            <Code2 size={14} /> código
          </button>
        </div>
        <div className={styles.toolbarGroup}>
          {(['table', 'link', 'details', 'rule', 'flag'] as const).map((id) => {
            const command = commandById(id);
            const Icon = command.icon;
            return (
              <button
                key={id}
                type="button"
                title={command.label}
                aria-label={command.label}
                onMouseDown={handleToolbarMouseDown}
                onClick={() => executeCommand(command)}
                className={styles.toolbarIconButton}
              >
                <Icon size={15} />
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => executeCommand(commandById('image'))}
            className={styles.toolbarIconButton}
            title="Imagem"
            aria-label="Imagem"
          >
            <ImageIcon size={15} />
          </button>
        </div>
        <div className={styles.slashHint}>
          digite <kbd>/</kbd> para todos os blocos
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelected} hidden />
      </div>

      <div className={styles.editorContentArea}>
        {viewMode === 'editar' && (
          <div className={styles.textareaWrap}>
            <textarea
              ref={textareaRef}
              value={draft.content}
              onChange={handleContentChange}
              onKeyDown={handleEditorKeyDown}
              onSelect={(event) => {
                selectionRef.current = {
                  start: event.currentTarget.selectionStart,
                  end: event.currentTarget.selectionEnd,
                };
              }}
              className={styles.editorTextarea}
              placeholder={'Comece a escrever…\n\nDigite / no início de uma linha para inserir um bloco.'}
              spellCheck={false}
            />
            {slashMenu}
          </div>
        )}
        {viewMode === 'dividir' && (
          <div className={styles.splitView}>
            <div className={styles.textareaWrap}>
              <textarea
                ref={textareaRef}
                value={draft.content}
                onChange={handleContentChange}
                onKeyDown={handleEditorKeyDown}
                onSelect={(event) => {
                  selectionRef.current = {
                    start: event.currentTarget.selectionStart,
                    end: event.currentTarget.selectionEnd,
                  };
                }}
                className={styles.editorTextareaSplit}
                spellCheck={false}
              />
              {slashMenu}
            </div>
            <div className={styles.previewPane}>
              <WriteupBody content={draft.content} />
            </div>
          </div>
        )}
        {viewMode === 'previa' && (
          <div className={styles.previewPaneFull}>
            <WriteupBody content={draft.content} />
          </div>
        )}
      </div>
    </div>
  );
}
