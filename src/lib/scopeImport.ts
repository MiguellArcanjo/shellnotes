// Parses the "structured scope" CSV export from HackerOne (and similar
// platforms). Tolerant of header naming differences since exports vary
// slightly between programs/platforms.

const IDENTIFIER_HEADERS = ['asset_identifier', 'identifier', 'asset', 'scope', 'target', 'domain', 'url', 'name'];
const ELIGIBILITY_HEADERS = ['eligible_for_submission', 'in_scope', 'eligibility', 'submission_eligible'];
const TRUTHY = new Set(['true', 'yes', '1', 'sim', 'in', 'in-scope', 'inscope']);

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\r') {
      continue;
    } else if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cellValue) => cellValue.trim() !== ''));
}

function findColumn(header: string[], knownNames: string[], fallbackKeywords: string[]): number {
  const exact = header.findIndex((h) => knownNames.includes(h));
  if (exact !== -1) return exact;
  return header.findIndex((h) => fallbackKeywords.some((keyword) => h.includes(keyword)));
}

export function parseScopeCsv(text: string): { scopeIn: string[]; scopeOut: string[] } {
  const rows = parseCsvRows(text.trim());
  if (rows.length === 0) return { scopeIn: [], scopeOut: [] };

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const identifierIdx = findColumn(header, IDENTIFIER_HEADERS, ['identifier', 'asset', 'scope', 'target']);
  if (identifierIdx === -1) return { scopeIn: [], scopeOut: [] };

  const eligibilityIdx = findColumn(header, ELIGIBILITY_HEADERS, ['eligible_for_submission', 'in_scope']);

  const scopeIn: string[] = [];
  const scopeOut: string[] = [];

  for (const row of rows.slice(1)) {
    const identifier = (row[identifierIdx] ?? '').trim();
    if (!identifier) continue;

    if (eligibilityIdx === -1) {
      scopeIn.push(identifier);
      continue;
    }

    const raw = (row[eligibilityIdx] ?? '').trim().toLowerCase();
    if (TRUTHY.has(raw)) scopeIn.push(identifier);
    else scopeOut.push(identifier);
  }

  return { scopeIn, scopeOut };
}
