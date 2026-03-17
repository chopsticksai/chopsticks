# CLI Reference

Chopsticks CLI now supports both:

- instance setup/diagnostics (`onboard`, `doctor`, `configure`, `env`, `allowed-hostname`)
- control-plane client operations (issues, approvals, agents, activity, dashboard)

## Base Usage

Use repo script in development:

```sh
pnpm chopsticks --help
```

First-time local bootstrap + run:

```sh
pnpm chopsticks run
```

Choose local instance:

```sh
pnpm chopsticks run --instance dev
```

## Deployment Modes

Mode taxonomy and design intent are documented in `doc/DEPLOYMENT-MODES.md`.

Current CLI behavior:

- `chopsticks onboard` and `chopsticks configure --section server` set deployment mode in config
- runtime can override mode with `CHOPSTICKS_DEPLOYMENT_MODE`
- `chopsticks run` and `chopsticks doctor` do not yet expose a direct `--mode` flag

Target behavior (planned) is documented in `doc/DEPLOYMENT-MODES.md` section 5.

Allow an authenticated/private hostname (for example custom Tailscale DNS):

```sh
pnpm chopsticks allowed-hostname dotta-macbook-pro
```

All client commands support:

- `--data-dir <path>`
- `--api-base <url>`
- `--api-key <token>`
- `--context <path>`
- `--profile <name>`
- `--json`

Company-scoped commands also support `--company-id <id>`.

Use `--data-dir` on any CLI command to isolate all default local state (config/context/db/logs/storage/secrets) away from `~/.chopsticks`:

```sh
pnpm chopsticks run --data-dir ./tmp/chopsticks-dev
pnpm chopsticks issue list --data-dir ./tmp/chopsticks-dev
```

## Context Profiles

Store local defaults in `~/.chopsticks/context.json`:

```sh
pnpm chopsticks context set --api-base http://localhost:3100 --company-id <company-id>
pnpm chopsticks context show
pnpm chopsticks context list
pnpm chopsticks context use default
```

To avoid storing secrets in context, set `apiKeyEnvVarName` and keep the key in env:

```sh
pnpm chopsticks context set --api-key-env-var-name CHOPSTICKS_API_KEY
export CHOPSTICKS_API_KEY=...
```

## Company Commands

```sh
pnpm chopsticks company list
pnpm chopsticks company get <company-id>
pnpm chopsticks company delete <company-id-or-prefix> --yes --confirm <same-id-or-prefix>
```

Examples:

```sh
pnpm chopsticks company delete PAP --yes --confirm PAP
pnpm chopsticks company delete 5cbe79ee-acb3-4597-896e-7662742593cd --yes --confirm 5cbe79ee-acb3-4597-896e-7662742593cd
```

Notes:

- Deletion is server-gated by `CHOPSTICKS_ENABLE_COMPANY_DELETION`.
- With agent authentication, company deletion is company-scoped. Use the current company ID/prefix (for example via `--company-id` or `CHOPSTICKS_COMPANY_ID`), not another company.

## Issue Commands

```sh
pnpm chopsticks issue list --company-id <company-id> [--status todo,in_progress] [--assignee-agent-id <agent-id>] [--match text]
pnpm chopsticks issue get <issue-id-or-identifier>
pnpm chopsticks issue create --company-id <company-id> --title "..." [--description "..."] [--status todo] [--priority high]
pnpm chopsticks issue update <issue-id> [--status in_progress] [--comment "..."]
pnpm chopsticks issue comment <issue-id> --body "..." [--reopen]
pnpm chopsticks issue checkout <issue-id> --agent-id <agent-id> [--expected-statuses todo,backlog,blocked]
pnpm chopsticks issue release <issue-id>
```

## Agent Commands

```sh
pnpm chopsticks agent list --company-id <company-id>
pnpm chopsticks agent get <agent-id>
pnpm chopsticks agent local-cli <agent-id-or-shortname> --company-id <company-id>
```

`agent local-cli` is the quickest way to run local Claude/Codex manually as a Chopsticks agent:

- creates a new long-lived agent API key
- installs missing Chopsticks skills into `~/.codex/skills` and `~/.claude/skills`
- prints `export ...` lines for `CHOPSTICKS_API_URL`, `CHOPSTICKS_COMPANY_ID`, `CHOPSTICKS_AGENT_ID`, and `CHOPSTICKS_API_KEY`

Example for shortname-based local setup:

```sh
pnpm chopsticks agent local-cli codexcoder --company-id <company-id>
pnpm chopsticks agent local-cli claudecoder --company-id <company-id>
```

## Approval Commands

```sh
pnpm chopsticks approval list --company-id <company-id> [--status pending]
pnpm chopsticks approval get <approval-id>
pnpm chopsticks approval create --company-id <company-id> --type hire_agent --payload '{"name":"..."}' [--issue-ids <id1,id2>]
pnpm chopsticks approval approve <approval-id> [--decision-note "..."]
pnpm chopsticks approval reject <approval-id> [--decision-note "..."]
pnpm chopsticks approval request-revision <approval-id> [--decision-note "..."]
pnpm chopsticks approval resubmit <approval-id> [--payload '{"...":"..."}']
pnpm chopsticks approval comment <approval-id> --body "..."
```

## Activity Commands

```sh
pnpm chopsticks activity list --company-id <company-id> [--agent-id <agent-id>] [--entity-type issue] [--entity-id <id>]
```

## Dashboard Commands

```sh
pnpm chopsticks dashboard get --company-id <company-id>
```

## Heartbeat Command

`heartbeat run` now also supports context/api-key options and uses the shared client stack:

```sh
pnpm chopsticks heartbeat run --agent-id <agent-id> [--api-base http://localhost:3100] [--api-key <token>]
```

## Local Storage Defaults

Default local instance root is `~/.chopsticks/instances/default`:

- config: `~/.chopsticks/instances/default/config.json`
- embedded db: `~/.chopsticks/instances/default/db`
- logs: `~/.chopsticks/instances/default/logs`
- storage: `~/.chopsticks/instances/default/data/storage`
- secrets key: `~/.chopsticks/instances/default/secrets/master.key`

Override base home or instance with env vars:

```sh
CHOPSTICKS_HOME=/custom/home CHOPSTICKS_INSTANCE_ID=dev pnpm chopsticks run
```

## Storage Configuration

Configure storage provider and settings:

```sh
pnpm chopsticks configure --section storage
```

Supported providers:

- `local_disk` (default; local single-user installs)
- `s3` (S3-compatible object storage)
