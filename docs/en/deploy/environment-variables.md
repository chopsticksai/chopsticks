---
title: Environment Variables
summary: Full environment variable reference
---

All environment variables that Chopsticks uses for server configuration.

## Server Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3100` | Server port |
| `HOST` | `127.0.0.1` | Server host binding |
| `DATABASE_URL` | (embedded) | PostgreSQL connection string |
| `CHOPSTICKS_HOME` | `~/.chopsticks` | Base directory for all Chopsticks data |
| `CHOPSTICKS_INSTANCE_ID` | `default` | Instance identifier (for multiple local instances) |
| `CHOPSTICKS_DEPLOYMENT_MODE` | `local_trusted` | Runtime mode override |

## Secrets

| Variable | Default | Description |
|----------|---------|-------------|
| `CHOPSTICKS_SECRETS_MASTER_KEY` | (from file) | 32-byte encryption key (base64/hex/raw) |
| `CHOPSTICKS_SECRETS_MASTER_KEY_FILE` | `~/.chopsticks/.../secrets/master.key` | Path to key file |
| `CHOPSTICKS_SECRETS_STRICT_MODE` | `false` | Require secret refs for sensitive env vars |

## Agent Runtime (Injected into agent processes)

These are set automatically by the server when invoking agents:

| Variable | Description |
|----------|-------------|
| `CHOPSTICKS_AGENT_ID` | Agent's unique ID |
| `CHOPSTICKS_COMPANY_ID` | Company ID |
| `CHOPSTICKS_API_URL` | Chopsticks API base URL |
| `CHOPSTICKS_API_KEY` | Short-lived JWT for API auth |
| `CHOPSTICKS_RUN_ID` | Current heartbeat run ID |
| `CHOPSTICKS_TASK_ID` | Issue that triggered this wake |
| `CHOPSTICKS_WAKE_REASON` | Wake trigger reason |
| `CHOPSTICKS_WAKE_COMMENT_ID` | Comment that triggered this wake |
| `CHOPSTICKS_APPROVAL_ID` | Resolved approval ID |
| `CHOPSTICKS_APPROVAL_STATUS` | Approval decision |
| `CHOPSTICKS_LINKED_ISSUE_IDS` | Comma-separated linked issue IDs |

## LLM Provider Keys (for adapters)

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key (for Claude Local adapter) |
| `OPENAI_API_KEY` | OpenAI API key (for Codex Local adapter) |
