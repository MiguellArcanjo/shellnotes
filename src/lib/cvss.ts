import type { Severity } from './bounty-data';

export type CvssAttackVector = 'N' | 'A' | 'L' | 'P';
export type CvssAttackComplexity = 'L' | 'H';
export type CvssPrivilegesRequired = 'N' | 'L' | 'H';
export type CvssUserInteraction = 'N' | 'R';
export type CvssScope = 'U' | 'C';
export type CvssImpactMetric = 'N' | 'L' | 'H';

export type CvssMetrics = {
  av: CvssAttackVector;
  ac: CvssAttackComplexity;
  pr: CvssPrivilegesRequired;
  ui: CvssUserInteraction;
  scope: CvssScope;
  c: CvssImpactMetric;
  i: CvssImpactMetric;
  a: CvssImpactMetric;
};

export type CvssSeverity = 'none' | 'low' | 'medium' | 'high' | 'critical';

export type CvssResult = {
  score: number;
  severity: CvssSeverity;
  vector: string;
};

export const DEFAULT_CVSS_METRICS: CvssMetrics = { av: 'N', ac: 'L', pr: 'N', ui: 'N', scope: 'U', c: 'L', i: 'L', a: 'N' };

export const CVSS_AV_OPTIONS: { value: CvssAttackVector; label: string }[] = [
  { value: 'N', label: 'Network' },
  { value: 'A', label: 'Adjacent' },
  { value: 'L', label: 'Local' },
  { value: 'P', label: 'Physical' },
];

export const CVSS_AC_OPTIONS: { value: CvssAttackComplexity; label: string }[] = [
  { value: 'L', label: 'Low' },
  { value: 'H', label: 'High' },
];

export const CVSS_PR_OPTIONS: { value: CvssPrivilegesRequired; label: string }[] = [
  { value: 'N', label: 'None' },
  { value: 'L', label: 'Low' },
  { value: 'H', label: 'High' },
];

export const CVSS_UI_OPTIONS: { value: CvssUserInteraction; label: string }[] = [
  { value: 'N', label: 'None' },
  { value: 'R', label: 'Required' },
];

export const CVSS_SCOPE_OPTIONS: { value: CvssScope; label: string }[] = [
  { value: 'U', label: 'Unchanged' },
  { value: 'C', label: 'Changed' },
];

export const CVSS_IMPACT_OPTIONS: { value: CvssImpactMetric; label: string }[] = [
  { value: 'N', label: 'None' },
  { value: 'L', label: 'Low' },
  { value: 'H', label: 'High' },
];

export const CVSS_SEVERITY_LABELS: Record<CvssSeverity, string> = {
  none: 'nenhuma',
  low: 'baixo',
  medium: 'médio',
  high: 'alto',
  critical: 'crítico',
};

const AV_VALUES: Record<CvssAttackVector, number> = { N: 0.85, A: 0.62, L: 0.55, P: 0.2 };
const AC_VALUES: Record<CvssAttackComplexity, number> = { L: 0.77, H: 0.44 };
const UI_VALUES: Record<CvssUserInteraction, number> = { N: 0.85, R: 0.62 };
const IMPACT_VALUES: Record<CvssImpactMetric, number> = { N: 0, L: 0.22, H: 0.56 };

function privilegesRequiredValue(pr: CvssPrivilegesRequired, scope: CvssScope): number {
  if (pr === 'N') return 0.85;
  if (pr === 'L') return scope === 'C' ? 0.68 : 0.62;
  return scope === 'C' ? 0.5 : 0.27;
}

// CVSS 3.1's official "round up to 1 decimal" — plain Math.round(x*10)/10 misrounds
// floating-point edge cases (e.g. 4.0 vs 4.000000000000001), so the spec defines
// this integer-based trick instead.
function roundUp(value: number): number {
  const intInput = Math.round(value * 100000);
  if (intInput % 10000 === 0) return intInput / 100000;
  return (Math.floor(intInput / 10000) + 1) / 10;
}

export function scoreToSeverity(score: number): CvssSeverity {
  if (score <= 0) return 'none';
  if (score < 4) return 'low';
  if (score < 7) return 'medium';
  if (score < 9) return 'high';
  return 'critical';
}

export function buildCvssVector(metrics: CvssMetrics): string {
  return `CVSS:3.1/AV:${metrics.av}/AC:${metrics.ac}/PR:${metrics.pr}/UI:${metrics.ui}/S:${metrics.scope}/C:${metrics.c}/I:${metrics.i}/A:${metrics.a}`;
}

export function calculateCvss(metrics: CvssMetrics): CvssResult {
  const av = AV_VALUES[metrics.av];
  const ac = AC_VALUES[metrics.ac];
  const pr = privilegesRequiredValue(metrics.pr, metrics.scope);
  const ui = UI_VALUES[metrics.ui];
  const c = IMPACT_VALUES[metrics.c];
  const i = IMPACT_VALUES[metrics.i];
  const a = IMPACT_VALUES[metrics.a];

  const iss = 1 - (1 - c) * (1 - i) * (1 - a);
  const impact = metrics.scope === 'C'
    ? 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15)
    : 6.42 * iss;
  const exploitability = 8.22 * av * ac * pr * ui;

  const score = impact <= 0
    ? 0
    : metrics.scope === 'C'
      ? roundUp(Math.min(1.08 * (impact + exploitability), 10))
      : roundUp(Math.min(impact + exploitability, 10));

  return { score, severity: scoreToSeverity(score), vector: buildCvssVector(metrics) };
}

// the finding's badge only has 4 tiers (no "none"), so a 0.0 score floors to "baixo"
export function cvssSeverityToFindingSeverity(severity: CvssSeverity): Severity {
  return severity === 'none' ? 'low' : severity;
}
