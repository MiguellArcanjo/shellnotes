export type ContentStatus = 'draft' | 'published';

export interface BaseContent {
  id: string;
  title: string;
  status: ContentStatus;
  date: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Writeup extends BaseContent {
  type: 'writeup';
  platform?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'insane';
  content: string;
}

export interface Cheatsheet extends BaseContent {
  type: 'cheatsheet';
  category: string;
  content: string;
}

export interface TIL extends BaseContent {
  type: 'til';
  category: string;
  content: string;
}

export interface CVE extends BaseContent {
  type: 'cve';
  cveId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedSoftware: string;
  content: string;
}

export interface GlossaryTerm extends BaseContent {
  type: 'glossary';
  term: string;
  definition: string;
  relatedTerms?: string[];
}

export type Content = Writeup | Cheatsheet | TIL | CVE | GlossaryTerm;