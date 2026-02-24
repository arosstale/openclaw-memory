---
name: openclaw-memory
description: Production-grade memory system for OpenClaw agents. Implements Hindsight Memory Architecture (Retain/Recall/Reflect) with ALMA meta-learning. Solves "memory keeps forgetting things" — the #1 OpenClaw FAQ.
---

# OpenClaw Memory System

Agent memory that **retains, recalls, and reflects** — automatically extracting structured knowledge, enabling semantic search, and optimizing its own design.

---

## Reality

**What memory is:**
- Plain Markdown in your workspace (git-backed, human-readable)
- Structured fact extraction from conversations
- Full-text + semantic search with citations
- Self-improving via ALMA meta-learning

**What memory is NOT:**
- A replacement for `MEMORY.md` (it extends it)
- A cloud service (works offline)
- A magic bullet (agents still need good prompts)
- A replacement for agent thinking (it's just storage)

**Key constraint:** Every fact must be **written to disk** to be remembered. Memory-in-context is temporary; persistent memory requires explicit writes.

---

## Quick Start (5 minutes)

### 1. Install

```bash
cd ~/.openclaw
npm install @openclaw/memory
```

### 2. Bootstrap workspace

```bash
openclaw memory init
```

Creates:
```
~/.openclaw/workspace/
├── MEMORY.md                    # core facts
├── memory/
│   └── 2026-02-24.md           # daily log
└── bank/
    ├── world.md                 # objective facts
    ├── experience.md            # what happened
    ├── opinions.md              # prefs + confidence
    └── entities/
        ├── Alice.md
        ├── The-Castle.md
        └── ...
```

### 3. Configure

In `~/.openclaw/openclaw.json`:

```json
{
  "plugins": {
    "memory": {
      "enabled": true,
      "provider": "@openclaw/memory",
      "config": {
        "workspace": "~/.openclaw/workspace",
        "embedProvider": "openai",
        "embedModel": "text-embedding-3-small",
        "llmProvider": "anthropic",
        "llmModel": "claude-opus-4-6"
      }
    }
  }
}
```

### 4. Use it

Agent calls:
```
memory_search("What does Alice prefer?")
memory_append("## Retain\n- O(c=0.95) @Alice: Prefers async communication")
```

---

## Workflows

### Session Startup

1. Load `MEMORY.md` (core facts) into context
2. Load `memory/yesterday.md` (recent context)
3. Warm embeddings cache
4. Ready to search

### During Session

Agent calls `memory_search()` to recall relevant facts:

```
Query: "What does Alice prefer?"

Result:
[
  {
    kind: "opinion",
    content: "Alice prefers async > sync",
    source: "bank/entities/Alice.md#L5",
    confidence: 0.95,
    timestamp: "2026-02-24T14:30:00Z"
  }
]
```

Agent calls `memory_append()` to write durable facts:

```
memory_append(
  "## Retain\n- W @Alice: Lives in NYC\n- O(c=0.92) @Alice: Values speed over perfection"
)
```

Writes to `memory/2026-02-24.md`.

### Pre-Compaction Flush (Automatic)

When session nears compaction (context ~80%), OpenClaw triggers silent agentic turn:

1. LLM reviews recent context
2. Calls `memory_search()` to surface related facts
3. Calls `memory_append()` to write what should stick
4. Session compaction happens

Config (in `openclaw.json`):

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

### Daily Reflection (Scheduled Job)

Runs overnight:

```bash
openclaw memory reflect --since 24h
```

Updates:
- `bank/entities/*.md` — entity summaries from daily logs
- `bank/opinions.md` — confidence-bearing beliefs
- `MEMORY.md` — adds stable facts

ALMA learns which memory designs work best during reflection.

---

## API Reference

### memory_search(query, k?, mode?)

Search indexed memory semantically + lexically.

**Parameters:**
- `query` (string) — natural language query, e.g. "What does Alice prefer?"
- `k` (number, default 5) — number of results
- `mode` (string, default 'hybrid') — 'fts5' (lexical only), 'semantic' (vectors only), 'hybrid' (both)

**Returns:**
```typescript
[
  {
    kind: "opinion" | "world" | "biographical" | "observation",
    timestamp: Date,
    entities: string[],  // ["Alice", "The-Castle"]
    content: string,
    source: string,      // "bank/entities/Alice.md#L5"
    confidence?: number  // 0.0-1.0 for opinions
  }
]
```

### memory_append(content, date?)

Append observations to daily log.

**Parameters:**
- `content` (string) — observations in Retain format
- `date` (string, optional) — date override (default: today)

**Format:**
```
## Retain
- (HH:MM) [Priority] Type @Entity: observation. (optional date)
```

**Examples:**
```
## Retain
- (14:30) [High] W @Alice: Lives in NYC.
- (14:45) [High] O(c=0.92) @Alice: Prefers async communication.
- (15:00) [Medium] B: Fixed critical bug in auth flow.
```

**Returns:**
```typescript
{
  file: "memory/2026-02-24.md",
  lines: [5, 8]  // line range appended
}
```

### memory_get(path, startLine?, numLines?)

Read a specific memory file or section.

**Parameters:**
- `path` (string) — workspace-relative, e.g. "bank/entities/Alice.md"
- `startLine` (number, optional) — start reading from this line
- `numLines` (number, optional) — read N lines

**Returns:**
```typescript
{
  text: "...markdown content...",
  path: "bank/entities/Alice.md"
}
```

---

## Observation Format (Retain)

Write observations in this format (auto-parsed by LLM):

```
(HH:MM) [Priority] Type @Entity: content. (optional date reference)
```

**Time:** 24-hour format when the fact was stated.

**Priority:** High (critical facts), Medium (learned info), Low (minor details).

**Type:**
- **W** — World (objective facts)
- **B** — Biographical (what happened)
- **O** — Opinion (preference + confidence)
- **S** — Summary (system-generated)

**Entity:** `@Name` mentions (slugified). Links to `bank/entities/Name.md`.

**Confidence:** Optional `(c=0.92)` for opinions (0.0-1.0).

**Date ref:** Optional `(meaning Feb 24, 2026)` if different from when stated.

### Examples

```
(14:30) [High] W @Alice: Lives in New York City.
(14:45) [High] O(c=0.95) @Alice: Prefers async communication > sync.
(15:00) [Medium] B: Debugged connection pool leak in server.ts.
(15:15) [Low] O(c=0.7) @The-Castle: Needs Wi-Fi upgrade soon.
```

---

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

Uses defaults:
- Workspace: `~/.openclaw/workspace`
- LLM: Claude (auto-detected from agent config)
- Embeddings: Disabled (falls back to FTS5 only)

### With Semantic Search (Recommended)

```json
{
  "plugins": {
    "memory": {
      "enabled": true,
      "provider": "@openclaw/memory",
      "config": {
        "workspace": "~/.openclaw/workspace",
        "llmProvider": "anthropic",
        "llmModel": "claude-opus-4-6",
        "embedProvider": "openai",
        "embedModel": "text-embedding-3-small",
        "chunkSize": 400,
        "chunkOverlap": 80,
        "hybridSearch": {
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

Works completely offline. No API keys needed.

---

## Troubleshooting

### "memory_search returns empty results"

**Cause:** Index not built yet.

**Fix:**
```bash
openclaw memory rebuild
```

### "Observations not extracted"

**Cause:** LLM provider not configured.

**Fix:** Set `llmProvider` and `llmModel` in config.

### "Semantic search not working"

**Cause:** Embeddings disabled.

**Fix:** Set `embedProvider` (openai, anthropic, gemini, or local).

### "Confidence scores wrong"

**Cause:** Format mismatch in observation.

**Fix:** Use `O(c=0.92)` exactly (no spaces, decimal 0.0-1.0).

---

## Advanced: ALMA Meta-Learning

ALMA evolves your memory system automatically.

### What ALMA does

1. **Proposes** design mutations (chunk size, embedding model, search weights)
2. **Evaluates** designs against metrics (recall quality, latency, compression)
3. **Learns** which designs maximize agent performance
4. **Suggests** improvements

### Enable ALMA

```json
{
  "plugins": {
    "memory": {
      "config": {
        "alma": {
          "enabled": true,
          "populationSize": 20,
          "mutationRate": 0.3
        }
      }
    }
  }
}
```

### Monitor ALMA

```bash
openclaw memory alma status
openclaw memory alma top-designs --k 5
```

---

## Examples

### Extract facts from conversation

Agent sees:
```
User: "I live in New York City and prefer async communication."
```

Agent calls:
```
memory_append(
  "## Retain\n" +
  "- (14:30) [High] W @User: Lives in New York City.\n" +
  "- (14:30) [High] O(c=0.95) @User: Prefers async communication."
)
```

### Search + recall

Agent calls:
```
memory_search("Where does the user live?")
```

Gets:
```
[{
  kind: "world",
  content: "Lives in New York City",
  source: "bank/entities/User.md#L3",
  timestamp: "2026-02-24T14:30:00Z"
}]
```

### Update opinion confidence

Overnight reflection runs:
```bash
openclaw memory reflect
```

Updates `bank/opinions.md`:
```
- @User: Prefers async (c=0.98, up from 0.95 — confirmed in 3 recent conversations)
```

---

## Philosophy

**Three principles:**

1. **Markdown is source of truth.** Humans read it. Git tracks it. Agents extend it.
2. **Offline-first.** Works on laptop, RPi, VPS. No cloud required.
3. **Explainable recall.** Every fact is citable (file + line). Confidence is tracked.

---

## References

- **Hindsight Technical Report** — Retain/Recall/Reflect architecture foundation
- **ALMA Paper (arXiv 2602.07755)** — Meta-learning agents for design optimization
- **ACT-R Cognitive Science** — Temporal anchoring and activation decay
- **OpenClaw Memory Docs** — https://docs.openclaw.ai/concepts/memory
- **OpenClaw Experiments** — https://docs.openclaw.ai/experiments/research/memory

---

## Support

- **Discord:** https://discord.gg/qkhbAGHRBT (mention `@openclaw-memory`)
- **GitHub Issues:** https://github.com/arosstale/openclaw-memory-ts/issues
- **Source:** https://github.com/arosstale/openclaw-memory-ts

---

**Your agent now has production-grade memory. Time to build.** 🧠
