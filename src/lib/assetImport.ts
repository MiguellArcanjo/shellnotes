import { createBlankAsset, type Asset } from './assets-data';

const IPV4_RE = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
const NMAP_GREPABLE_RE = /^Host:\s*(\S+)\s*(?:\(([^)]*)\))?\s*Ports:\s*(.+)$/i;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseNmapGrepableLine(line: string): Partial<Asset> | null {
  const match = line.match(NMAP_GREPABLE_RE);
  if (!match) return null;
  const [, ip, hostname, portsBlob] = match;

  const openPorts = portsBlob
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.split('/'))
    .filter(([, state]) => state === 'open')
    .map(([port, , proto, , service]) => `${port}/${service || proto || ''}`.replace(/\/$/, ''));

  return {
    host: hostname?.trim() || ip,
    ips: IPV4_RE.test(ip) ? [ip] : [],
    openPorts,
    resolve: 'vivo',
  };
}

function parseHttpxLine(line: string): Partial<Asset> | null {
  if (!line.includes('[') || !line.includes(']')) return null;
  const host = line.split(/\s+/, 1)[0];
  if (!host) return null;

  const patch: Partial<Asset> = { host };
  let titleSet = false;

  for (const m of line.matchAll(/\[([^\]]*)\]/g)) {
    const inner = m[1].trim();
    if (!inner) continue;

    if (/^\d{3}$/.test(inner)) {
      patch.httpStatus = inner;
      continue;
    }

    const parts = inner.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0 && parts.every((p) => IPV4_RE.test(p))) {
      patch.ips = parts;
      continue;
    }

    if (parts.length > 1) {
      patch.techStack = parts;
      continue;
    }

    if (!titleSet) {
      patch.pageTitle = inner;
      titleSet = true;
    }
  }

  return patch;
}

export function parseAssetPasteList(
  text: string,
  existingHosts: Iterable<string>,
): { created: Asset[]; skippedDuplicates: number } {
  const seen = new Set<string>(Array.from(existingHosts, (h) => h.toLowerCase()));
  const created: Asset[] = [];
  let skippedDuplicates = 0;
  let index = 0;

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const patch = parseNmapGrepableLine(line) ?? parseHttpxLine(line) ?? { host: line };
    const host = patch.host?.trim();
    if (!host) continue;

    const key = host.toLowerCase();
    if (seen.has(key)) {
      skippedDuplicates += 1;
      continue;
    }
    seen.add(key);

    index += 1;
    const base = createBlankAsset(`asset-${Date.now()}-${index}`);
    created.push({
      ...base,
      ...patch,
      host,
      discoverySource: 'outro',
      firstSeen: todayIso(),
      lastSeen: todayIso(),
    });
  }

  return { created, skippedDuplicates };
}
