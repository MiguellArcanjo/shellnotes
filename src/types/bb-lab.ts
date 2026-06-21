export type BBLabSeverity = 'Critical' | 'High' | 'Medium' | 'Low' | 'None';

export type BBLabPayload = {
  label: string;
  code: string;
  note: string;
  source: 'report-publico' | 'laboratorio';
};

export type BBLabReport = {
  id: string;
  titleOriginal: string;
  titlePt: string;
  summaryPt: string;
  program: string;
  programHandle: string;
  researcher: string;
  researcherName: string;
  severity: BBLabSeverity;
  cwe: string;
  cves: string[];
  bounty: number | null;
  currency: string;
  votes: number;
  disclosedAt: string;
  submittedAt: string;
  url: string;
  technique: string;
  surface: string;
  impact: string;
  bypasses: string[];
  payloads: BBLabPayload[];
  practice: string[];
  fieldQuestions: string[];
  tags: string[];
};

export type BBLabResponse = {
  reports: BBLabReport[];
  page: number;
  pageSize: number;
  total: number;
  fetchedAt: string;
  source: string;
};

export type BBLabPublicDetail = {
  reportId: string;
  summaryOriginal: string;
  payloads: BBLabPayload[];
  technicalNotes: string[];
  fetchedAt: string;
};
