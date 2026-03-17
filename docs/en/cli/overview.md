---
title: CLI Overview
summary: CLI installation and setup
---

The Chopsticks CLI handles instance setup, diagnostics, and control-plane operations.

## Usage

```sh
pnpm chopsticks --help
```

## Global Options

All commands support:

| Flag | Description |
|------|-------------|
| `--data-dir <path>` | Local Chopsticks data root (isolates from `~/.chopsticks`) |
| `--api-base <url>` | API base URL |
| `--api-key <token>` | API authentication token |
| `--context <path>` | Context file path |
| `--profile <name>` | Context profile name |
| `--json` | Output as JSON |

Company-scoped commands also accept `--company-id <id>`.

For clean local instances, pass `--data-dir` on the command you run:

```sh
pnpm chopsticks run --data-dir ./tmp/chopsticks-dev
```

## Context Profiles

Store defaults to avoid repeating flags:

```sh
# Set defaults
pnpm chopsticks context set --api-base http://localhost:3100 --company-id <id>

# View current context
pnpm chopsticks context show

# List profiles
pnpm chopsticks context list

# Switch profile
pnpm chopsticks context use default
```

To avoid storing secrets in context, use an env var:

```sh
pnpm chopsticks context set --api-key-env-var-name CHOPSTICKS_API_KEY
export CHOPSTICKS_API_KEY=...
```

Context is stored at `~/.chopsticks/context.json`.

## Command Categories

The CLI has two categories:

1. **[Setup commands](/en/cli/setup-commands)** — instance bootstrap, diagnostics, configuration
2. **[Control-plane commands](/en/cli/control-plane-commands)** — issues, agents, approvals, activity
