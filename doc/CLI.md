# CLI Reference

Abacus CLI now supports both:

- instance setup/diagnostics (`onboard`, `doctor`, `configure`, `env`, `allowed-hostname`)
- control-plane client operations (issues, approvals, agents, activity, dashboard)

## Base Usage

Use repo script in development:

```sh
pnpm abacus --help
```

First-time local bootstrap + run:

```sh
pnpm abacus run
```

Choose local instance:

```sh
pnpm abacus run --instance dev
```

## Deployment Modes

Mode taxonomy and design intent are documented in `doc/DEPLOYMENT-MODES.md`.

Current CLI behavior:

- `abacus onboard` and `abacus configure --section server` set deployment mode in config
- runtime can override mode with `ABACUS_DEPLOYMENT_MODE`
- `abacus run` and `abacus doctor` do not yet expose a direct `--mode` flag

Target behavior (planned) is documented in `doc/DEPLOYMENT-MODES.md` section 5.

Allow an authenticated/private hostname (for example custom Tailscale DNS):

```sh
pnpm abacus allowed-hostname dotta-macbook-pro
```

All client commands support:

- `--data-dir <path>`
- `--api-base <url>`
- `--api-key <token>`
- `--context <path>`
- `--profile <name>`
- `--json`

Company-scoped commands also support `--company-id <id>`.

Use `--data-dir` on any CLI command to isolate all default local state (config/context/db/logs/storage/secrets) away from `~/.abacus`:

```sh
pnpm abacus run --data-dir ./tmp/abacus-dev
pnpm abacus issue list --data-dir ./tmp/abacus-dev
```

## Context Profiles

Store local defaults in `~/.abacus/context.json`:

```sh
pnpm abacus context set --api-base http://localhost:3100 --company-id <company-id>
pnpm abacus context show
pnpm abacus context list
pnpm abacus context use default
```

To avoid storing secrets in context, set `apiKeyEnvVarName` and keep the key in env:

```sh
pnpm abacus context set --api-key-env-var-name ABACUS_API_KEY
export ABACUS_API_KEY=...
```

## Company Commands

```sh
pnpm abacus company list
pnpm abacus company get <company-id>
pnpm abacus company delete <company-id-or-prefix> --yes --confirm <same-id-or-prefix>
```

Examples:

```sh
pnpm abacus company delete PAP --yes --confirm PAP
pnpm abacus company delete 5cbe79ee-acb3-4597-896e-7662742593cd --yes --confirm 5cbe79ee-acb3-4597-896e-7662742593cd
```

Notes:

- Deletion is server-gated by `ABACUS_ENABLE_COMPANY_DELETION`.
- With agent authentication, company deletion is company-scoped. Use the current company ID/prefix (for example via `--company-id` or `ABACUS_COMPANY_ID`), not another company.

## Issue Commands

```sh
pnpm abacus issue list --company-id <company-id> [--status todo,in_progress] [--assignee-agent-id <agent-id>] [--match text]
pnpm abacus issue get <issue-id-or-identifier>
pnpm abacus issue create --company-id <company-id> --title "..." [--description "..."] [--status todo] [--priority high]
pnpm abacus issue update <issue-id> [--status in_progress] [--comment "..."]
pnpm abacus issue comment <issue-id> --body "..." [--reopen]
pnpm abacus issue checkout <issue-id> --agent-id <agent-id> [--expected-statuses todo,backlog,blocked]
pnpm abacus issue release <issue-id>
```

## Agent Commands

```sh
pnpm abacus agent list --company-id <company-id>
pnpm abacus agent get <agent-id>
pnpm abacus agent local-cli <agent-id-or-shortname> --company-id <company-id>
```

`agent local-cli` is the quickest way to run local Claude/Codex manually as a Abacus agent:

- creates a new long-lived agent API key
- installs missing Abacus skills into `~/.codex/skills` and `~/.claude/skills`
- prints `export ...` lines for `ABACUS_API_URL`, `ABACUS_COMPANY_ID`, `ABACUS_AGENT_ID`, and `ABACUS_API_KEY`

Example for shortname-based local setup:

```sh
pnpm abacus agent local-cli codexcoder --company-id <company-id>
pnpm abacus agent local-cli claudecoder --company-id <company-id>
```

## Approval Commands

```sh
pnpm abacus approval list --company-id <company-id> [--status pending]
pnpm abacus approval get <approval-id>
pnpm abacus approval create --company-id <company-id> --type hire_agent --payload '{"name":"..."}' [--issue-ids <id1,id2>]
pnpm abacus approval approve <approval-id> [--decision-note "..."]
pnpm abacus approval reject <approval-id> [--decision-note "..."]
pnpm abacus approval request-revision <approval-id> [--decision-note "..."]
pnpm abacus approval resubmit <approval-id> [--payload '{"...":"..."}']
pnpm abacus approval comment <approval-id> --body "..."
```

## Activity Commands

```sh
pnpm abacus activity list --company-id <company-id> [--agent-id <agent-id>] [--entity-type issue] [--entity-id <id>]
```

## Dashboard Commands

```sh
pnpm abacus dashboard get --company-id <company-id>
```

## Heartbeat Command

`heartbeat run` now also supports context/api-key options and uses the shared client stack:

```sh
pnpm abacus heartbeat run --agent-id <agent-id> [--api-base http://localhost:3100] [--api-key <token>]
```

## Local Storage Defaults

Default local instance root is `~/.abacus/instances/default`:

- config: `~/.abacus/instances/default/config.json`
- embedded db: `~/.abacus/instances/default/db`
- logs: `~/.abacus/instances/default/logs`
- storage: `~/.abacus/instances/default/data/storage`
- secrets key: `~/.abacus/instances/default/secrets/master.key`

Override base home or instance with env vars:

```sh
ABACUS_HOME=/custom/home ABACUS_INSTANCE_ID=dev pnpm abacus run
```

## Storage Configuration

Configure storage provider and settings:

```sh
pnpm abacus configure --section storage
```

Supported providers:

- `local_disk` (default; local single-user installs)
- `s3` (S3-compatible object storage)
