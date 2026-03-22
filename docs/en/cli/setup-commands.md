---
title: Setup Commands
summary: Onboard, run, doctor, and configure
---

Instance setup and diagnostics commands.

## `runeach run`

One-command bootstrap and start:

```sh
pnpm runeach run
```

Does:

1. Auto-onboards if config is missing
2. Runs `runeach doctor` with repair enabled
3. Starts the server when checks pass

Choose a specific instance:

```sh
pnpm runeach run --instance dev
```

## `runeach onboard`

Interactive first-time setup:

```sh
pnpm runeach onboard
```

First prompt:

1. `Quickstart` (recommended): local defaults (embedded database, no LLM provider, local disk storage, default secrets)
2. `Advanced setup`: full interactive configuration

Start immediately after onboarding:

```sh
pnpm runeach onboard --run
```

Non-interactive defaults + immediate start (opens browser on server listen):

```sh
pnpm runeach onboard --yes
```

## `runeach doctor`

Health checks with optional auto-repair:

```sh
pnpm runeach doctor
pnpm runeach doctor --repair
```

Validates:

- Server configuration
- Database connectivity
- Secrets adapter configuration
- Storage configuration
- Missing key files

## `runeach configure`

Update configuration sections:

```sh
pnpm runeach configure --section server
pnpm runeach configure --section secrets
pnpm runeach configure --section storage
```

## `runeach env`

Show resolved environment configuration:

```sh
pnpm runeach env
```

## `runeach allowed-hostname`

Allow a private hostname for authenticated/private mode:

```sh
pnpm runeach allowed-hostname my-tailscale-host
```

## Local Storage Paths

| Data | Default Path |
|------|-------------|
| Config | `~/.runeach/instances/default/config.json` |
| Database | `~/.runeach/instances/default/db` |
| Logs | `~/.runeach/instances/default/logs` |
| Storage | `~/.runeach/instances/default/data/storage` |
| Secrets key | `~/.runeach/instances/default/secrets/master.key` |

Override with:

```sh
RUNEACH_HOME=/custom/home RUNEACH_INSTANCE_ID=dev pnpm runeach run
```

Or pass `--data-dir` directly on any command:

```sh
pnpm runeach run --data-dir ./tmp/runeach-dev
pnpm runeach doctor --data-dir ./tmp/runeach-dev
```
