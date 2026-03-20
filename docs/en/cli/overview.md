---
title: CLI Overview
summary: CLI installation and setup
---

The Abacus CLI handles instance setup, diagnostics, and control-plane operations.

## Usage

```sh
pnpm abacus --help
```

## Global Options

All commands support:

| Flag | Description |
|------|-------------|
| `--data-dir <path>` | Local Abacus data root (isolates from `~/.abacus`) |
| `--api-base <url>` | API base URL |
| `--api-key <token>` | API authentication token |
| `--context <path>` | Context file path |
| `--profile <name>` | Context profile name |
| `--json` | Output as JSON |

Company-scoped commands also accept `--company-id <id>`.

For clean local instances, pass `--data-dir` on the command you run:

```sh
pnpm abacus run --data-dir ./tmp/abacus-dev
```

## Context Profiles

Store defaults to avoid repeating flags:

```sh
# Set defaults
pnpm abacus context set --api-base http://localhost:3100 --company-id <id>

# View current context
pnpm abacus context show

# List profiles
pnpm abacus context list

# Switch profile
pnpm abacus context use default
```

To avoid storing secrets in context, use an env var:

```sh
pnpm abacus context set --api-key-env-var-name ABACUS_API_KEY
export ABACUS_API_KEY=...
```

Context is stored at `~/.abacus/context.json`.

## Command Categories

The CLI has two categories:

1. **[Setup commands](/en/cli/setup-commands)** — instance bootstrap, diagnostics, configuration
2. **[Control-plane commands](/en/cli/control-plane-commands)** — issues, agents, approvals, activity
