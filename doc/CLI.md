# CLI Reference

RunEach CLI now supports both:

- instance setup/diagnostics (`onboard`, `doctor`, `configure`, `env`, `allowed-hostname`)
- control-plane client operations (issues, approvals, agents, activity, dashboard)

## Base Usage

Use repo script in development:

```sh
pnpm runeach --help
```

First-time local bootstrap + run:

```sh
pnpm runeach run
```

Choose local instance:

```sh
pnpm runeach run --instance dev
```

## Deployment Modes

Mode taxonomy and design intent are documented in `doc/DEPLOYMENT-MODES.md`.

Current CLI behavior:

- `runeach onboard` and `runeach configure --section server` set deployment mode in config
- runtime can override mode with `RUNEACH_DEPLOYMENT_MODE`
- `runeach run` and `runeach doctor` do not yet expose a direct `--mode` flag

Target behavior (planned) is documented in `doc/DEPLOYMENT-MODES.md` section 5.

Allow an authenticated/private hostname (for example custom Tailscale DNS):

```sh
pnpm runeach allowed-hostname dotta-macbook-pro
```

All client commands support:

- `--data-dir <path>`
- `--api-base <url>`
- `--api-key <token>`
- `--context <path>`
- `--profile <name>`
- `--json`

Company-scoped commands also support `--company-id <id>`.

Use `--data-dir` on any CLI command to isolate all default local state (config/context/db/logs/storage/secrets) away from `~/.runeach`:

```sh
pnpm runeach run --data-dir ./tmp/runeach-dev
pnpm runeach issue list --data-dir ./tmp/runeach-dev
```

## Context Profiles

Store local defaults in `~/.runeach/context.json`:

```sh
pnpm runeach context set --api-base http://localhost:3100 --company-id <company-id>
pnpm runeach context show
pnpm runeach context list
pnpm runeach context use default
```

To avoid storing secrets in context, set `apiKeyEnvVarName` and keep the key in env:

```sh
pnpm runeach context set --api-key-env-var-name RUNEACH_API_KEY
export RUNEACH_API_KEY=...
```

## Company Commands

```sh
pnpm runeach company list
pnpm runeach company get <company-id>
pnpm runeach company delete <company-id-or-prefix> --yes --confirm <same-id-or-prefix>
```

Examples:

```sh
pnpm runeach company delete PAP --yes --confirm PAP
pnpm runeach company delete 5cbe79ee-acb3-4597-896e-7662742593cd --yes --confirm 5cbe79ee-acb3-4597-896e-7662742593cd
```

Notes:

- Deletion is server-gated by `RUNEACH_ENABLE_COMPANY_DELETION`.
- With agent authentication, company deletion is company-scoped. Use the current company ID/prefix (for example via `--company-id` or `RUNEACH_COMPANY_ID`), not another company.

## Issue Commands

```sh
pnpm runeach issue list --company-id <company-id> [--status todo,in_progress] [--assignee-agent-id <agent-id>] [--match text]
pnpm runeach issue get <issue-id-or-identifier>
pnpm runeach issue create --company-id <company-id> --title "..." [--description "..."] [--status todo] [--priority high]
pnpm runeach issue update <issue-id> [--status in_progress] [--comment "..."]
pnpm runeach issue comment <issue-id> --body "..." [--reopen]
pnpm runeach issue checkout <issue-id> --agent-id <agent-id> [--expected-statuses todo,backlog,blocked]
pnpm runeach issue release <issue-id>
```

## Agent Commands

```sh
pnpm runeach agent list --company-id <company-id>
pnpm runeach agent get <agent-id>
pnpm runeach agent local-cli <agent-id-or-shortname> --company-id <company-id>
```

`agent local-cli` is the quickest way to run local Claude/Codex manually as a RunEach agent:

- creates a new long-lived agent API key
- installs missing RunEach skills into `~/.codex/skills` and `~/.claude/skills`
- prints `export ...` lines for `RUNEACH_API_URL`, `RUNEACH_COMPANY_ID`, `RUNEACH_AGENT_ID`, and `RUNEACH_API_KEY`

Example for shortname-based local setup:

```sh
pnpm runeach agent local-cli codexcoder --company-id <company-id>
pnpm runeach agent local-cli claudecoder --company-id <company-id>
```

## Approval Commands

```sh
pnpm runeach approval list --company-id <company-id> [--status pending]
pnpm runeach approval get <approval-id>
pnpm runeach approval create --company-id <company-id> --type hire_agent --payload '{"name":"..."}' [--issue-ids <id1,id2>]
pnpm runeach approval approve <approval-id> [--decision-note "..."]
pnpm runeach approval reject <approval-id> [--decision-note "..."]
pnpm runeach approval request-revision <approval-id> [--decision-note "..."]
pnpm runeach approval resubmit <approval-id> [--payload '{"...":"..."}']
pnpm runeach approval comment <approval-id> --body "..."
```

## Activity Commands

```sh
pnpm runeach activity list --company-id <company-id> [--agent-id <agent-id>] [--entity-type issue] [--entity-id <id>]
```

## Dashboard Commands

```sh
pnpm runeach dashboard get --company-id <company-id>
```

## Heartbeat Command

`heartbeat run` now also supports context/api-key options and uses the shared client stack:

```sh
pnpm runeach heartbeat run --agent-id <agent-id> [--api-base http://localhost:3100] [--api-key <token>]
```

## Local Storage Defaults

Default local instance root is `~/.runeach/instances/default`:

- config: `~/.runeach/instances/default/config.json`
- embedded db: `~/.runeach/instances/default/db`
- logs: `~/.runeach/instances/default/logs`
- storage: `~/.runeach/instances/default/data/storage`
- secrets key: `~/.runeach/instances/default/secrets/master.key`

Override base home or instance with env vars:

```sh
RUNEACH_HOME=/custom/home RUNEACH_INSTANCE_ID=dev pnpm runeach run
```

## Storage Configuration

Configure storage provider and settings:

```sh
pnpm runeach configure --section storage
```

Supported providers:

- `local_disk` (default; local single-user installs)
- `s3` (S3-compatible object storage)
