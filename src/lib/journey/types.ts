export type QuestionStatus = 'open' | 'testing' | 'resolved';
export type LibraryKind = 'book' | 'course' | 'video' | 'article' | 'lab';
export type LibraryStatus = 'wishlist' | 'in-progress' | 'completed' | 'abandoned';
export type CertificateStatus = 'planned' | 'earning' | 'earned';
export type ProjectStatus = 'idea' | 'active' | 'paused' | 'completed';

export type JourneyQuestion = {
  id: string;
  title: string;
  context: string;
  hypothesis: string;
  experiment: string;
  answer: string;
  sourceUrl: string;
  tags: string[];
  status: QuestionStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string;
};

export type LibraryItem = {
  id: string;
  title: string;
  kind: LibraryKind;
  status: LibraryStatus;
  author: string;
  provider: string;
  url: string;
  progress: number;
  rating: number;
  notes: string;
  learnings: string;
  tags: string[];
  startedAt: string;
  completedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type JourneyCertificate = {
  id: string;
  title: string;
  issuer: string;
  status: CertificateStatus;
  targetAt: string;
  issuedAt: string;
  expiresAt: string;
  credentialId: string;
  credentialUrl: string;
  filePath: string;
  fileName: string;
  skills: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectTask = {
  id: string;
  title: string;
  done: boolean;
};

export type ProjectLog = {
  id: string;
  date: string;
  text: string;
};

export type ProjectDecision = {
  id: string;
  date: string;
  title: string;
  reason: string;
};

export type JourneyProject = {
  id: string;
  title: string;
  status: ProjectStatus;
  summary: string;
  objective: string;
  technologies: string[];
  repoUrl: string;
  demoUrl: string;
  startedAt: string;
  targetAt: string;
  completedAt: string;
  tasks: ProjectTask[];
  journal: ProjectLog[];
  decisions: ProjectDecision[];
  learnings: string;
  createdAt: string;
  updatedAt: string;
};

export type JourneyData = {
  questions: JourneyQuestion[];
  library: LibraryItem[];
  certificates: JourneyCertificate[];
  projects: JourneyProject[];
  updatedAt: string;
};

export const EMPTY_JOURNEY: JourneyData = {
  questions: [],
  library: [],
  certificates: [],
  projects: [],
  updatedAt: '',
};

export function newJourneyId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function blankQuestion(): JourneyQuestion {
  const now = nowIso();
  return {
    id: newJourneyId('question'),
    title: '',
    context: '',
    hypothesis: '',
    experiment: '',
    answer: '',
    sourceUrl: '',
    tags: [],
    status: 'open',
    createdAt: now,
    updatedAt: now,
    resolvedAt: '',
  };
}

export function blankLibraryItem(): LibraryItem {
  const now = nowIso();
  return {
    id: newJourneyId('library'),
    title: '',
    kind: 'course',
    status: 'wishlist',
    author: '',
    provider: '',
    url: '',
    progress: 0,
    rating: 0,
    notes: '',
    learnings: '',
    tags: [],
    startedAt: '',
    completedAt: '',
    createdAt: now,
    updatedAt: now,
  };
}

export function blankCertificate(): JourneyCertificate {
  const now = nowIso();
  return {
    id: newJourneyId('certificate'),
    title: '',
    issuer: '',
    status: 'planned',
    targetAt: '',
    issuedAt: '',
    expiresAt: '',
    credentialId: '',
    credentialUrl: '',
    filePath: '',
    fileName: '',
    skills: [],
    notes: '',
    createdAt: now,
    updatedAt: now,
  };
}

export function blankProject(): JourneyProject {
  const now = nowIso();
  return {
    id: newJourneyId('project'),
    title: '',
    status: 'idea',
    summary: '',
    objective: '',
    technologies: [],
    repoUrl: '',
    demoUrl: '',
    startedAt: '',
    targetAt: '',
    completedAt: '',
    tasks: [],
    journal: [],
    decisions: [],
    learnings: '',
    createdAt: now,
    updatedAt: now,
  };
}
