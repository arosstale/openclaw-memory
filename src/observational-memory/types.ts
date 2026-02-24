/**
 * Observational Memory - Temporal fact extraction
 * Based on cognitive science (ACT-R, temporal anchoring)
 */

export type ObservationKind = 'world' | 'biographical' | 'opinion' | 'observation';
export type PriorityLevel = 'high' | 'medium' | 'low';

export interface Observation {
  kind: ObservationKind;
  timestamp: Date;
  entities: string[]; // e.g., ["Alice", "The-Castle"]
  content: string;
  source: string; // file path + line number
  priority: PriorityLevel;
  confidence?: number; // 0.0 to 1.0, for opinions
}

export interface ObservationConfig {
  workspace: string;
  memoryDir: string;
  llmProvider: 'openai' | 'anthropic' | 'gemini';
  llmModel: string;
  apiKey: string;
}

export interface TemporalAnchor {
  beginTime: Date; // when statement was made
  endTime?: Date; // when being referenced (if different)
}
