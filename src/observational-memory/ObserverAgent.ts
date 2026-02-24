/**
 * Observer Agent - Extracts observations from message history
 *
 * Uses LLM to intelligently extract structured facts with:
 * - Type tags (W/B/O/S)
 * - Entity mentions (@Alice, @The-Castle)
 * - Temporal anchoring (when + what-if-different)
 * - Priority levels (High/Medium/Low)
 * - Confidence scores for opinions
 */

import {
  Observation,
  ObservationConfig,
  ObservationKind,
  PriorityLevel,
  TemporalAnchor,
} from './types';

export class ObserverAgent {
  private config: ObservationConfig;

  // System prompt for the LLM
  private readonly SYSTEM_PROMPT = `You are the memory consciousness of an AI assistant. Your observations will be ONLY information that assistant has about past interactions with this user.

CORE PRINCIPLES:

1. BE SPECIFIC - Vague observations are useless. Capture details that distinguish and identify.
2. ANCHOR IN TIME - Note when things happened and when they were said.
3. TRACK STATE CHANGES - When information updates or supersedes previous info, make it explicit.
4. USE COMMON SENSE - If it would help assistant remember later, observe it.

ASSERTIONS VS QUESTIONS:
- User TELLS you something → 🔴 "User stated [fact]"
- User ASKS something → 🟡 "User asked [question]"
- User assertions are authoritative. They are the source of truth about their own life.

FORMAT:
Each observation on its own line in this format:
(24-hour time) [priority] [observation]. (optional date reference)

Priorities:
- 🔴 High: explicit user facts, preferences, goals achieved, critical context
- 🟡 Medium: project details, learned information, tool results
- 🟢 Low: minor details, uncertain observations

REMEMBER: These observations are assistant's ENTIRE memory. Any detail you fail to observe is permanently forgotten. When in doubt, observe it.`;

  constructor(config: ObservationConfig) {
    this.config = config;
  }

  /**
   * Extract observations from a message history
   * @param messages Message history from a conversation
   * @returns Array of structured observations
   */
  async extractObservations(
    messages: Array<{ role: string; content: string; timestamp: Date }>
  ): Promise<Observation[]> {
    const observations: Observation[] = [];

    // TODO: Call LLM with system prompt + message history
    // TODO: Parse LLM response to extract:
    //   - Type prefix (W/B/O/S)
    //   - Entity mentions (@Alice)
    //   - Time and optional date
    //   - Priority level (High/Medium/Low)
    //   - Confidence for opinions

    return observations;
  }

  /**
   * Parse a single observation line
   * Example: "14:30 [High] User stated Alice prefers async > sync. (meaning Feb 24, 2026)"
   */
  private parseObservation(
    line: string,
    sourceFile: string,
    lineNumber: number
  ): Observation | null {
    // TODO: Implement parsing logic
    // - Extract time: "14:30"
    // - Extract priority: "[High]"
    // - Extract entities: "@Alice", "@The-Castle"
    // - Extract confidence: "O(c=0.92)"
    // - Extract date reference: "(meaning Feb 24, 2026)"

    return null;
  }

  /**
   * Extract temporal anchors from observation
   * Returns: { beginTime: when stated, endTime: when referenced (if different) }
   */
  private extractTemporalAnchor(observation: string): TemporalAnchor {
    // TODO: Parse time references like:
    // - "today", "yesterday", "last week", "March 2026"
    // - Return (begin: when stated, end: when being referenced)

    return { beginTime: new Date() };
  }

  /**
   * Extract entity mentions (@Name) from observation
   */
  private extractEntities(text: string): string[] {
    const matches = text.match(/@[\w-]+/g) || [];
    return matches.map((m) => m.slice(1)); // Remove @ prefix
  }

  /**
   * Classify observation kind and priority
   */
  private classifyObservation(line: string): {
    kind: ObservationKind;
    priority: PriorityLevel;
  } {
    // TODO: Parse type prefix and priority
    // W = world, B = biographical, O = opinion, S = summary
    // [High], [Medium], [Low]

    return { kind: 'observation', priority: 'medium' };
  }

  /**
   * Extract confidence score from opinion observations
   * Example: O(c=0.92) means 92% confident
   */
  private extractConfidence(text: string): number | undefined {
    const match = text.match(/\(c=([0-9.]+)\)/);
    return match ? parseFloat(match[1]) : undefined;
  }
}
