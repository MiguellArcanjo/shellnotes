// A small but *real* SQL evaluator built for teaching SQL injection.
//
// It is intentionally NOT a token matcher: the player's input is concatenated
// into a vulnerable query template exactly like a naive backend would do, and
// the resulting SQL is genuinely parsed and evaluated against in-memory tables.
// `' OR '1'='1`, `UNION SELECT`, comments (`--`/`#`) and login bypasses all work
// because the boolean logic is actually executed — not because we look for a
// magic substring. That honesty is what makes the lab feel like the real thing.

export type SqlValue = string | number;
export type SqlRow = Record<string, SqlValue>;

export type SqlTable = {
  name: string;
  columns: string[];
  rows: SqlRow[];
};

export type SqlResult = {
  query: string;
  columns: string[];
  rows: SqlRow[];
  error: string | null;
};

export type SqlDatabase = Record<string, SqlTable>;

// ---------------------------------------------------------------------------
// Seed data. `released = 0` rows are "hidden" treasure for boolean/UNION labs;
// the users table is the exfiltration target for UNION attacks.
// ---------------------------------------------------------------------------

export function seedDatabase(): SqlDatabase {
  const products: SqlTable = {
    name: 'products',
    columns: ['id', 'name', 'category', 'price', 'released'],
    rows: [
      { id: 1, name: 'Caneca Hacker', category: 'Gifts', price: 39, released: 1 },
      { id: 2, name: 'Adesivos OWASP', category: 'Gifts', price: 12, released: 1 },
      { id: 3, name: 'Camiseta Burp', category: 'Roupas', price: 89, released: 1 },
      { id: 4, name: 'Teclado mecânico', category: 'Acessorios', price: 420, released: 1 },
      { id: 5, name: 'Yubikey 5C', category: 'Acessorios', price: 310, released: 1 },
      // Hidden / unreleased — só aparecem se a injeção quebrar o filtro released=1.
      { id: 90, name: 'Protótipo interno v2', category: 'Gifts', price: 0, released: 0 },
      { id: 91, name: 'Cupom FUNCIONARIO-2026', category: 'Gifts', price: 0, released: 0 },
      { id: 92, name: 'Chave de licença mestra', category: 'Acessorios', price: 0, released: 0 },
    ],
  };

  const users: SqlTable = {
    name: 'users',
    columns: ['id', 'username', 'password', 'role'],
    rows: [
      { id: 1, username: 'admin', password: 'S3cr3t_Adm1n!', role: 'admin' },
      { id: 2, username: 'wiener', password: 'peter', role: 'user' },
      { id: 3, username: 'carlos', password: 'montoya', role: 'user' },
    ],
  };

  return { products, users };
}

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

type TokenType = 'string' | 'number' | 'ident' | 'op' | 'paren' | 'keyword' | 'star' | 'comma';
type Token = { type: TokenType; value: string };

const KEYWORDS = new Set([
  'select', 'from', 'where', 'and', 'or', 'not', 'union', 'all', 'like', 'is', 'null', 'true', 'false',
]);

function stripComments(sql: string): string {
  // Remove `-- ...` and `# ...` comments, but never inside a quoted string.
  let out = '';
  let inString = false;
  for (let i = 0; i < sql.length; i += 1) {
    const ch = sql[i];
    if (ch === "'") {
      // handle doubled '' escape
      if (inString && sql[i + 1] === "'") {
        out += "''";
        i += 1;
        continue;
      }
      inString = !inString;
      out += ch;
      continue;
    }
    if (!inString && ch === '-' && sql[i + 1] === '-') break;
    if (!inString && ch === '#') break;
    out += ch;
  }
  return out;
}

function tokenize(sql: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < sql.length) {
    const ch = sql[i];
    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }
    if (ch === "'") {
      let value = '';
      i += 1;
      while (i < sql.length) {
        if (sql[i] === "'" && sql[i + 1] === "'") {
          value += "'";
          i += 2;
          continue;
        }
        if (sql[i] === "'") {
          i += 1;
          break;
        }
        value += sql[i];
        i += 1;
      }
      tokens.push({ type: 'string', value });
      continue;
    }
    if (/[0-9]/.test(ch)) {
      let value = '';
      while (i < sql.length && /[0-9.]/.test(sql[i])) {
        value += sql[i];
        i += 1;
      }
      tokens.push({ type: 'number', value });
      continue;
    }
    if (ch === '(' || ch === ')') {
      tokens.push({ type: 'paren', value: ch });
      i += 1;
      continue;
    }
    if (ch === '*') {
      tokens.push({ type: 'star', value: '*' });
      i += 1;
      continue;
    }
    if (ch === ',') {
      tokens.push({ type: 'comma', value: ',' });
      i += 1;
      continue;
    }
    if ('=<>!'.includes(ch)) {
      let value = ch;
      i += 1;
      while (i < sql.length && '=<>'.includes(sql[i])) {
        value += sql[i];
        i += 1;
      }
      tokens.push({ type: 'op', value });
      continue;
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let value = '';
      while (i < sql.length && /[a-zA-Z0-9_.]/.test(sql[i])) {
        value += sql[i];
        i += 1;
      }
      const lower = value.toLowerCase();
      tokens.push({ type: KEYWORDS.has(lower) ? 'keyword' : 'ident', value });
      continue;
    }
    // Unknown character — skip so a stray symbol doesn't crash the lab.
    i += 1;
  }
  return tokens;
}

// ---------------------------------------------------------------------------
// WHERE-expression evaluator (recursive descent)
// ---------------------------------------------------------------------------

class ExprParser {
  private pos = 0;
  private readonly tokens: Token[];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private next(): Token | undefined {
    const token = this.tokens[this.pos];
    this.pos += 1;
    return token;
  }

  private isKeyword(word: string): boolean {
    const token = this.peek();
    return token?.type === 'keyword' && token.value.toLowerCase() === word;
  }

  parse(row: SqlRow): boolean {
    const value = this.parseOr(row);
    return toBool(value);
  }

  private parseOr(row: SqlRow): SqlValue {
    let left = this.parseAnd(row);
    while (this.isKeyword('or')) {
      this.next();
      const right = this.parseAnd(row);
      left = toBool(left) || toBool(right) ? 1 : 0;
    }
    return left;
  }

  private parseAnd(row: SqlRow): SqlValue {
    let left = this.parseNot(row);
    while (this.isKeyword('and')) {
      this.next();
      const right = this.parseNot(row);
      left = toBool(left) && toBool(right) ? 1 : 0;
    }
    return left;
  }

  private parseNot(row: SqlRow): SqlValue {
    if (this.isKeyword('not')) {
      this.next();
      return toBool(this.parseNot(row)) ? 0 : 1;
    }
    return this.parseComparison(row);
  }

  private parseComparison(row: SqlRow): SqlValue {
    const left = this.parsePrimary(row);
    const token = this.peek();
    if (token?.type === 'op') {
      this.next();
      const right = this.parsePrimary(row);
      return compare(left, token.value, right) ? 1 : 0;
    }
    if (this.isKeyword('like')) {
      this.next();
      const right = this.parsePrimary(row);
      return like(left, right) ? 1 : 0;
    }
    if (this.isKeyword('is')) {
      this.next();
      let negate = false;
      if (this.isKeyword('not')) {
        this.next();
        negate = true;
      }
      if (this.isKeyword('null')) this.next();
      const isNull = left === '' || left === undefined;
      return (negate ? !isNull : isNull) ? 1 : 0;
    }
    return left;
  }

  private parsePrimary(row: SqlRow): SqlValue {
    const token = this.next();
    if (!token) return '';
    if (token.type === 'paren' && token.value === '(') {
      const value = this.parseOr(row);
      const close = this.peek();
      if (close?.type === 'paren' && close.value === ')') this.next();
      return value;
    }
    if (token.type === 'string') return token.value;
    if (token.type === 'number') return Number(token.value);
    if (token.type === 'keyword') {
      const lower = token.value.toLowerCase();
      if (lower === 'true') return 1;
      if (lower === 'false') return 0;
      if (lower === 'null') return '';
    }
    if (token.type === 'ident') {
      const key = resolveColumn(row, token.value);
      return key !== null ? row[key] : '';
    }
    return token.value;
  }
}

function resolveColumn(row: SqlRow, name: string): string | null {
  const bare = name.includes('.') ? name.split('.').pop()! : name;
  const target = bare.toLowerCase();
  return Object.keys(row).find((key) => key.toLowerCase() === target) ?? null;
}

function toBool(value: SqlValue): boolean {
  if (typeof value === 'number') return value !== 0;
  return value !== '' && value !== '0';
}

function compare(left: SqlValue, op: string, right: SqlValue): boolean {
  const bothNumeric = isNumeric(left) && isNumeric(right);
  const a: SqlValue = bothNumeric ? Number(left) : String(left);
  const b: SqlValue = bothNumeric ? Number(right) : String(right);
  switch (op) {
    case '=':
    case '==':
      return a === b;
    case '!=':
    case '<>':
      return a !== b;
    case '<':
      return a < b;
    case '>':
      return a > b;
    case '<=':
      return a <= b;
    case '>=':
      return a >= b;
    default:
      return false;
  }
}

function isNumeric(value: SqlValue): boolean {
  return typeof value === 'number' || (value !== '' && !Number.isNaN(Number(value)));
}

function like(left: SqlValue, right: SqlValue): boolean {
  const pattern = String(right)
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/%/g, '.*')
    .replace(/_/g, '.');
  return new RegExp(`^${pattern}$`, 'i').test(String(left));
}

// ---------------------------------------------------------------------------
// Query runner
// ---------------------------------------------------------------------------

function evalWhere(rows: SqlRow[], whereTokens: Token[]): SqlRow[] {
  if (whereTokens.length === 0) return rows;
  return rows.filter((row) => {
    try {
      return new ExprParser(whereTokens).parse(row);
    } catch {
      return false;
    }
  });
}

function runSelect(db: SqlDatabase, tokens: Token[]): { columns: string[]; rows: SqlRow[] } {
  // SELECT <cols> FROM <table> [WHERE <expr>]
  let i = 0;
  if (tokens[i]?.value.toLowerCase() !== 'select') throw new Error('Esperado SELECT.');
  i += 1;

  const selectCols: string[] = [];
  let star = false;
  while (i < tokens.length && tokens[i].value.toLowerCase() !== 'from') {
    const token = tokens[i];
    if (token.type === 'star') star = true;
    else if (token.type !== 'comma') selectCols.push(token.value);
    i += 1;
  }

  if (tokens[i]?.value.toLowerCase() !== 'from') throw new Error('Esperado FROM.');
  i += 1;
  const tableName = tokens[i]?.value?.toLowerCase();
  const table = tableName ? db[tableName] : undefined;
  if (!table) throw new Error(`Tabela "${tableName ?? '?'}" não existe.`);
  i += 1;

  let whereTokens: Token[] = [];
  if (tokens[i]?.value.toLowerCase() === 'where') {
    i += 1;
    whereTokens = tokens.slice(i);
  }

  const matched = evalWhere(table.rows, whereTokens);

  if (star) {
    return { columns: table.columns, rows: matched };
  }

  // Projected columns can be real column names OR literals (UNION-style probing).
  const columns = selectCols.map((col) => col);
  const rows = matched.map((row) => {
    const projected: SqlRow = {};
    selectCols.forEach((col, index) => {
      const key = resolveColumn(row, col);
      const header = `col${index + 1}`;
      if (key !== null) projected[header] = row[key];
      else if (/^[0-9]+$/.test(col)) projected[header] = Number(col);
      else projected[header] = col; // literal string passthrough
    });
    return projected;
  });
  return { columns: columns.map((_, index) => `col${index + 1}`), rows };
}

/**
 * Run a vulnerable query template with the player's raw input concatenated in.
 * `template` must contain the literal placeholder `__INPUT__`.
 */
export function runVulnerableQuery(
  db: SqlDatabase,
  template: string,
  input: string,
): SqlResult {
  const query = template.replace('__INPUT__', input);
  try {
    const cleaned = stripComments(query);
    const tokens = tokenize(cleaned);

    // Split on a top-level UNION [ALL] SELECT.
    const unionIndex = tokens.findIndex(
      (token, index) =>
        token.type === 'keyword' &&
        token.value.toLowerCase() === 'union' &&
        tokens.slice(index + 1).some((t) => t.value.toLowerCase() === 'select'),
    );

    if (unionIndex >= 0) {
      const left = tokens.slice(0, unionIndex);
      let rest = tokens.slice(unionIndex + 1);
      if (rest[0]?.value.toLowerCase() === 'all') rest = rest.slice(1);
      const first = runSelect(db, left);
      const second = runSelect(db, rest);
      // Map the second SELECT onto the first result's headers (positional UNION).
      const merged = second.rows.map((row) => {
        const aligned: SqlRow = {};
        const values = Object.values(row);
        first.columns.forEach((header, index) => {
          aligned[header] = values[index] ?? '';
        });
        return aligned;
      });
      return { query, columns: first.columns, rows: [...first.rows, ...merged], error: null };
    }

    const result = runSelect(db, tokens);
    return { query, columns: result.columns, rows: result.rows, error: null };
  } catch (cause) {
    return {
      query,
      columns: [],
      rows: [],
      error: cause instanceof Error ? cause.message : 'Erro de sintaxe SQL.',
    };
  }
}
