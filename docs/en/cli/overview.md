---
title: CLI Overview
summary: CLI installation and setup
---

The RunEach CLI handles instance setup, diagnostics, and control-plane operations.

## Usage

```sh
pnpm runeach --help
```

## Global Options

All commands support:

| Flag | Description |
|------|-------------|
| `--data-dir <path>` | Local RunEach data root (isolates from `~/.runeach`) |
| `--api-base <url>` | API base URL |
| `--api-key <token>` | API authentication token |
| `--context <path>` | Context file path |
| `--profile <name>` | Context profile name |
| `--json` | Output as JSON |

Company-scoped commands also accept `--company-id <id>`.

For clean local instances, pass `--data-dir` on the command you run:

```sh
pnpm runeach run --data-dir ./tmp/runeach-dev
```

## Context Profiles

Store defaults to avoid repeating flags:

```sh
# Set defaults
pnpm runeach context set --api-base http://localhost:3100 --company-id <id>

# View current context
pnpm runeach context show

# List profiles
pnpm runeach context list

# Switch profile
pnpm runeach context use default
```

To avoid storing secrets in context, use an env var:

```sh
pnpm runeach context set --api-key-env-var-name RUNEACH_API_KEY
export RUNEACH_API_KEY=...
```

Context is stored at `~/.runeach/context.json`.

## Command Categories

The CLI has two categories:

1. **[Setup commands](/en/cli/setup-commands)** — instance bootstrap, diagnostics, configuration
2. **[Control-plane commands](/en/cli/control-plane-commands)** — issues, agents, approvals, activity
