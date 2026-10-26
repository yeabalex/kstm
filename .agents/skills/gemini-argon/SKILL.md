---
name: gemini-argon
description: >-
  Use this skill to query Google's Gemini 4 Argon reasoning model directly via Vertex AI.
  Provides architectural analysis, complex reasoning, and code refactoring suggestions from Argon.
---

# Gemini 4 Argon Skill

This skill allows you to consult **Gemini 4 Argon** (`gemini-4-argon`) directly via Google Cloud Vertex AI using your authenticated Google Cloud project (`ai-agy-512808`).

## When to use this skill
- When you want deep architectural review or planning from Gemini 4 Argon.
- When you want a second opinion on complex refactoring (e.g., migrating to a monorepo).
- When Roo Code is throttled or encountering 429 rate limit issues.

## Usage

Run the helper script from the workspace root:

```bash
# Direct prompt:
.agents/skills/gemini-argon/scripts/query_argon.py --prompt "Your prompt here"

# With context files:
.agents/skills/gemini-argon/scripts/query_argon.py \
  --context package.json \
  --prompt "Analyze this package.json and provide a monorepo migration plan"

# From stdin:
cat file.ts | .agents/skills/gemini-argon/scripts/query_argon.py
```

> [!NOTE]
> Gemini 4 Argon is hosted on the multi-region `global` Vertex AI endpoint. On PayGo tiers without Provisioned Throughput, requests may occasionally queue during high load.
