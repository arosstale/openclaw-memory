# Hindsight Memory System - OpenClaw Integration Guide

This guide shows how to integrate the Hindsight Memory System into OpenClaw as a first-party plugin.

## Architecture

The system implements **Retain → Recall → Reflect**:

```
Daily Log (memory/YYYY-MM-DD.md)
        ↓
   [Retain] ObserverAgent extracts facts
        ↓
   SQLite Index (FTS5 + embeddings)
        ↓
   [Recall] MemoryIndexer.search() + memory_search tool
        ↓
   bank/entities/*.md, bank/opinions.md
        ↓
   [Reflect] ALMAAgent proposes better design
        ↓
   MEMORY.md updated with stable facts
```

## Installation

### 1. Install as OpenClaw plugin

```bash
cd ~/.openclaw
npm install @openclaw/memory
```

### 2. Register in OpenClaw config

```json
{
  "plugins": {
    "memory": {
      "enabled": true,
      "provider": "@openclaw/memory",
      "config": {
        "workspace": "~/.openclaw/workspace",
        "embedProvider": "openai",
        "embedModel": "text-embedding-3-small"
      }
    }
  }
}
```

### 3. Bootstrap workspace

```bash
openclaw memory init
```

Creates:

```
~/.openclaw/workspace/
├── MEMORY.md
├── memory/
│   └── 2026-02-24.md
└── bank/
    ├── world.md
    ├── experience.md
    ├── opinions.md
    └── entities/
```

## API (OpenClaw Agent Tools)

### memory_search

Semantic + lexical search over indexed memory.

```
Agent: "Find facts about Alice"

Tool Call:
  memory_search(
    query="Alice",
    k=5,
    mode="hybrid"
  )

Response:
  {
    results: [
      {
        kind: "opinion",
        timestamp: "2026-02-24T14:30:00Z",
        entities: ["Alice"],
        content: "Alice prefers async > sync",
        source: "bank/entities/Alice.md#L12",
        confidence: 0.92
      },
      ...
    ]
  }
```

### memory_get

Read a specific memory file or section.

```
Agent: "Get Alice's full profile"

Tool Call:
  memory_get(
    path="bank/entities/Alice.md"
  )

Response:
  {
    text: "... Alice profile markdown ...",
    path: "bank/entities/Alice.md"
  }
```

### memory_append

Write to today's daily log.

```
Agent: "Remember this"

Tool Call:
  memory_append(
    content="## Retain\n- O(c=0.95) @Alice: Prefers concise replies"
  )

Response:
  {
    file: "memory/2026-02-24.md",
    lines: [23, 24]
  }
```

## Workflow

### Session Startup

1. Load `MEMORY.md` into context (core facts)
2. Load `memory/yesterday.md` for recent context
3. Warm up embeddings (cache hit in most cases)

### During Session

- Agent calls `memory_search` when it needs to recall something
- Agent calls `memory_append` during conversation to write durable facts
- Observations are added to `memory/YYYY-MM-DD.md`

### Pre-Compaction (Automatic)

OpenClaw triggers a silent agentic turn that:

1. Calls `memory_search` to surface recent facts
2. Calls `memory_append` to write what should stick
3. Stores to `memory/YYYY-MM-DD.md`

Config:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "enabled": true,
          "softThresholdTokens": 4000,
          "systemPrompt": "Session nearing compaction. Store durable memories now."
        }
      }
    }
  }
}
```

### Overnight (Daily Reflection)

A scheduled job runs:

```bash
openclaw memory reflect --since 24h
```

This:

1. Extracts structured facts from daily logs
2. Updates `bank/entities/*.md` with entity summaries
3. Updates `bank/opinions.md` with confidence-bearing beliefs
4. Adds stable facts to `MEMORY.md`

## Configuration

### Minimal (Just Works)

```json
{
  "plugins": {
    "memory": {
      "enabled": true,
      "provider": "@openclaw/memory"
    }
  }
}
```

### With Semantic Search (Recommended)

```json
{
  "plugins": {
    "memory": {
      "enabled": true,
      "provider": "@openclaw/memory",
      "config": {
        "embedProvider": "openai",
        "embedModel": "text-embedding-3-small",
        "chunkSize": 400,
        "chunkOverlap": 80,
        "hybridSearch": {
          "enabled": true,
          "vectorWeight": 0.7,
          "textWeight": 0.3
        }
      }
    }
  }
}
```

### With Local Embeddings (Offline)

```json
{
  "plugins": {
    "memory": {
      "enabled": true,
      "provider": "@openclaw/memory",
      "config": {
        "embedProvider": "local",
        "embedModel": "hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf"
      }
    }
  }
}
```

## Philosophy

**Three principles:**

1. **Markdown is source of truth.** Humans read it, git tracks it, agents extend it.
2. **Offline-first.** Works on laptop, RPi, VPS. No cloud required.
3. **Explainable recall.** Every fact is citable (file + line). Confidence is tracked.

## Next Steps

- [ ] Implement ALMA mutation strategies (Gaussian, simulated annealing, crossover, adaptive)
- [ ] Implement ObserverAgent LLM integration (parse type/entity/confidence tags)
- [ ] Implement MemoryIndexer embedding + vector search
- [ ] Add reflection job scheduler
- [ ] Add bank/entities and bank/opinions auto-generation
- [ ] Test end-to-end with openclaw
- [ ] Submit to openclaw/openclaw as plugin PR

## References

- **Hindsight Technical Report**: Retain/Recall/Reflect architecture
- **ALMA Paper (arXiv 2602.07755)**: Meta-learning agents
- **ACT-R**: Cognitive science foundations (temporal anchoring, activation scoring)
- **OpenClaw Memory Docs**: https://docs.openclaw.ai/concepts/memory
- **OpenClaw Experiments**: https://docs.openclaw.ai/experiments/research/memory
