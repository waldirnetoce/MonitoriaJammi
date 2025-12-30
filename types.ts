
export type StatusType = 'CONFORME' | 'NÃO CONFORME' | 'FALHA GRAVE (NCG)';
export type RigorLevel = 'LIGHT' | 'MEDIUM' | 'EXPERT';

export interface ScorecardCriterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  category: string;
}

export interface NcgItem {
  id: string;
  name: string;
  description: string;
}

export interface CriteriaStatus {
  criterionId: string;
  status: StatusType;
  observation: string;
  pointsEarned: number;
  maxPoints: number;
}

export interface AnalysisResult {
  evaluationStatus: StatusType;
  totalScore: number;
  reasonForCall: string;
  criteriaScores: CriteriaStatus[];
  summary: string;
  systemReadyText: string;
  operatorFeedback: string;
  isNcgDetected: boolean;
  monitorId?: string;
  auditDate?: string;
  rigorApplied?: RigorLevel;
}

export interface Interaction {
  id: string;
  agentName: string;
  date: string;
  transcript: string;
  result?: AnalysisResult;
}

export interface VoiceProfile {
  voiceName: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
  tonalityDescription: string;
}
