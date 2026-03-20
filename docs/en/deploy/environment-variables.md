---
title: Environment Variables
summary: Full environment variable reference
---

All environment variables that Abacus uses for server configuration.

## Server Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3100` | Server port |
| `HOST` | `127.0.0.1` | Server host binding |
| `DATABASE_URL` | (embedded) | PostgreSQL connection string |
| `ABACUS_HOME` | `~/.abacus` | Base directory for all Abacus data |
| `ABACUS_INSTANCE_ID` | `default` | Instance identifier (for multiple local instances) |
| `ABACUS_DEPLOYMENT_MODE` | `local_trusted` | Runtime mode override |

## Secrets

| Variable | Default | Description |
|----------|---------|-------------|
| `ABACUS_SECRETS_MASTER_KEY` | (from file) | 32-byte encryption key (base64/hex/raw) |
| `ABACUS_SECRETS_MASTER_KEY_FILE` | `~/.abacus/.../secrets/master.key` | Path to key file |
| `ABACUS_SECRETS_STRICT_MODE` | `false` | Require secret refs for sensitive env vars |

## Agent Runtime (Injected into agent processes)

These are set automatically by the server when invoking agents:

| Variable | Description |
|----------|-------------|
| `ABACUS_AGENT_ID` | Agent's unique ID |
| `ABACUS_COMPANY_ID` | Company ID |
| `ABACUS_API_URL` | Abacus API base URL |
| `ABACUS_API_KEY` | Short-lived JWT for API auth |
| `ABACUS_RUN_ID` | Current heartbeat run ID |
| `ABACUS_TASK_ID` | Issue that triggered this wake |
| `ABACUS_WAKE_REASON` | Wake trigger reason |
| `ABACUS_WAKE_COMMENT_ID` | Comment that triggered this wake |
| `ABACUS_APPROVAL_ID` | Resolved approval ID |
| `ABACUS_APPROVAL_STATUS` | Approval decision |
| `ABACUS_LINKED_ISSUE_IDS` | Comma-separated linked issue IDs |

## LLM Provider Keys (for adapters)

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key (for Claude Local adapter) |
| `OPENAI_API_KEY` | OpenAI API key (for Codex Local adapter) |
