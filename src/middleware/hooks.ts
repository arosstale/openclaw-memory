/**
 * Auto-Hook Middleware
 * Intercepts agent requests/responses and auto-extracts/injects memories
 */

import { ObserverAgent } from '../observational-memory/ObserverAgent';
import { MemoryIndexer } from '../knowledge/MemoryIndexer';
import { ObservationConfig } from '../observational-memory/types';

export interface HookConfig {
  llmConfig: ObservationConfig;
  indexPath: string;
  workspace: string;
  enabled: boolean;
  autoExtract: boolean; // Auto-extract from every turn
  autoInject: boolean;  // Auto-inject into system prompt
}

export interface AgentRequest {
  messages: Array<{ role: string; content: string }>;
  systemPrompt?: string;
  metadata?: Record<string, any>;
}

export interface AgentResponse {
  messages: Array<{ role: string; content: string }>;
  metadata?: Record<string, any>;
}

export class MemoryHook {
  private observer: ObserverAgent;
  readonly indexer: MemoryIndexer;
  private config: HookConfig;

  constructor(config: HookConfig) {
    this.config = config;
    this.observer = new ObserverAgent(config.llmConfig);
    this.indexer = new MemoryIndexer({
      workspace: config.workspace,
      dbPath: config.indexPath,
    });
  }

  /**
   * Hook: Before agent request
   * Injects relevant memories into system prompt
   */
  async beforeRequest(request: AgentRequest): Promise<AgentRequest> {
    if (!this.config.enabled || !this.config.autoInject) {
      return request;
    }

    try {
      // Get recent messages context
      const recentMessages = request.messages.slice(-5);
      const context = recentMessages.map((m) => m.content).join('\n');

      // Search for relevant memories
      const memories = await this.indexer.search(context, 3, 'hybrid');

      // Inject into system prompt
      if (memories.length > 0) {
        const memoryContext = `## Relevant Memories:\n${memories
          .map((m) => `- ${m.text} (source: ${m.file})`)
          .join('\n')}`;

        const updatedPrompt = `${request.systemPrompt || ''}\n\n${memoryContext}`;

        return {
          ...request,
          systemPrompt: updatedPrompt,
          metadata: {
            ...request.metadata,
            injectMemories: memories.length,
          },
        };
      }

      return request;
    } catch (e) {
      console.warn('[Memory] Failed to inject memories:', e instanceof Error ? e.message : e);
      return request; // Graceful degradation
    }
  }

  /**
   * Hook: After agent response
   * Auto-extracts observations from conversation
   */
  async afterResponse(
    request: AgentRequest,
    response: AgentResponse
  ): Promise<AgentResponse> {
    if (!this.config.enabled || !this.config.autoExtract) {
      return response;
    }

    try {
      // Combine request + response for observation extraction
      const messages = [
        ...request.messages,
        {
          role: 'assistant' as const,
          content: response.messages.map((m) => m.content).join('\n'),
          timestamp: new Date(),
        },
      ];

      // Extract observations
      const observations = await this.observer.extractObservations(
        messages as any,
        'auto-extracted'
      );

      // Store extracted observations count in metadata
      return {
        ...response,
        metadata: {
          ...response.metadata,
          extractedObservations: observations.length,
        },
      };
    } catch (e) {
      console.warn('[Memory] Failed to extract observations:', e instanceof Error ? e.message : e);
      return response; // Graceful degradation
    }
  }

  /**
   * Rebuild index (after memory updates)
   */
  async rebuild(): Promise<void> {
    await this.indexer.rebuild();
  }

  /**
   * Get memory stats
   */
  async getStats(): Promise<{
    indexed: number;
    autoExtractions: number;
    autoInjections: number;
  }> {
    // TODO: Track stats in database
    return {
      indexed: 0,
      autoExtractions: 0,
      autoInjections: 0,
    };
  }
}

/**
 * OpenClaw Plugin Interface
 * Registers hooks with openclaw agent system
 */
export function createMemoryPlugin(config: HookConfig) {
  const hook = new MemoryHook(config);

  return {
    name: '@openclaw/memory',
    version: '1.0.0',

    hooks: {
      // Before agent executes request
      'agent:beforeRequest': (request: AgentRequest) => hook.beforeRequest(request),

      // After agent gets response
      'agent:afterResponse': (request: AgentRequest, response: AgentResponse) =>
        hook.afterResponse(request, response),
    },

    commands: {
      // CLI commands
      'memory:search': (query: string) => hook.indexer.search(query, 5, 'hybrid'),
      'memory:rebuild': () => hook.rebuild(),
      'memory:stats': () => hook.getStats(),
    },
  };
}
