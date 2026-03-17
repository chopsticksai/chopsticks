---
title: Setup Commands
summary: Onboard, run, doctor, and configure
---

Instance setup and diagnostics commands.

## `chopsticks run`

One-command bootstrap and start:

```sh
pnpm chopsticks run
```

Does:

1. Auto-onboards if config is missing
2. Runs `chopsticks doctor` with repair enabled
3. Starts the server when checks pass

Choose a specific instance:

```sh
pnpm chopsticks run --instance dev
```

## `chopsticks onboard`

Interactive first-time setup:

```sh
pnpm chopsticks onboard
```

First prompt:

1. `Quickstart` (recommended): local defaults (embedded database, no LLM provider, local disk storage, default secrets)
2. `Advanced setup`: full interactive configuration

Start immediately after onboarding:

```sh
pnpm chopsticks onboard --run
```

Non-interactive defaults + immediate start (opens browser on server listen):

```sh
pnpm chopsticks onboard --yes
```

## `chopsticks doctor`

Health checks with optional auto-repair:

```sh
pnpm chopsticks doctor
pnpm chopsticks doctor --repair
```

Validates:

- Server configuration
- Database connectivity
- Secrets adapter configuration
- Storage configuration
- Missing key files

## `chopsticks configure`

Update configuration sections:

```sh
pnpm chopsticks configure --section server
pnpm chopsticks configure --section secrets
pnpm chopsticks configure --section storage
```

## `chopsticks env`

Show resolved environment configuration:

```sh
pnpm chopsticks env
```

## `chopsticks allowed-hostname`

Allow a private hostname for authenticated/private mode:

```sh
pnpm chopsticks allowed-hostname my-tailscale-host
```

## Local Storage Paths

| Data | Default Path |
|------|-------------|
| Config | `~/.chopsticks/instances/default/config.json` |
| Database | `~/.chopsticks/instances/default/db` |
| Logs | `~/.chopsticks/instances/default/logs` |
| Storage | `~/.chopsticks/instances/default/data/storage` |
| Secrets key | `~/.chopsticks/instances/default/secrets/master.key` |

Override with:

```sh
CHOPSTICKS_HOME=/custom/home CHOPSTICKS_INSTANCE_ID=dev pnpm chopsticks run
```

Or pass `--data-dir` directly on any command:

```sh
pnpm chopsticks run --data-dir ./tmp/chopsticks-dev
pnpm chopsticks doctor --data-dir ./tmp/chopsticks-dev
```
