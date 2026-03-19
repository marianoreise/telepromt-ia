// ── Tipos principales de la app desktop ListnrIO ──────────────────────────────

export type AppScreen =
  | 'login'
  | 'main'
  | 'wizard'
  | 'activate'
  | 'session-active'
  | 'collapsed';

export type SessionType = 'free' | 'full';

export type SessionLanguage = 'castellano' | 'ingles' | 'cast-eng';

export type MainTab = 'crear' | 'sesiones';

export type WizardStep = 1 | 2;

export interface User {
  id: string;
  email: string;
  credits: number;
}

export interface SessionConfig {
  type: SessionType;
  company: string;
  jobDescription: string;
  language: SessionLanguage;
  simpleLanguage: boolean;
  extraContext: string;
  resumeId: string | null;
  aiModel: string;
  autoGenerate: boolean;
  saveTranscript: boolean;
}

export interface Session {
  id: string;
  company: string;
  language: string;
  status: 'active' | 'completed' | 'expired';
  type: SessionType;
  createdAt: string;
}

export interface Transcript {
  text: string;
  isFinal: boolean;
}

export interface AIMessage {
  question: string;
  answer: string;
  timestamp: number;
}
