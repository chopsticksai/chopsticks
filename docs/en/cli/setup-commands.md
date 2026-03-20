---
title: Setup Commands
summary: Onboard, run, doctor, and configure
---

Instance setup and diagnostics commands.

## `abacus run`

One-command bootstrap and start:

```sh
pnpm abacus run
```

Does:

1. Auto-onboards if config is missing
2. Runs `abacus doctor` with repair enabled
3. Starts the server when checks pass

Choose a specific instance:

```sh
pnpm abacus run --instance dev
```

## `abacus onboard`

Interactive first-time setup:

```sh
pnpm abacus onboard
```

First prompt:

1. `Quickstart` (recommended): local defaults (embedded database, no LLM provider, local disk storage, default secrets)
2. `Advanced setup`: full interactive configuration

Start immediately after onboarding:

```sh
pnpm abacus onboard --run
```

Non-interactive defaults + immediate start (opens browser on server listen):

```sh
pnpm abacus onboard --yes
```

## `abacus doctor`

Health checks with optional auto-repair:

```sh
pnpm abacus doctor
pnpm abacus doctor --repair
```

Validates:

- Server configuration
- Database connectivity
- Secrets adapter configuration
- Storage configuration
- Missing key files

## `abacus configure`

Update configuration sections:

```sh
pnpm abacus configure --section server
pnpm abacus configure --section secrets
pnpm abacus configure --section storage
```

## `abacus env`

Show resolved environment configuration:

```sh
pnpm abacus env
```

## `abacus allowed-hostname`

Allow a private hostname for authenticated/private mode:

```sh
pnpm abacus allowed-hostname my-tailscale-host
```

## Local Storage Paths

| Data | Default Path |
|------|-------------|
| Config | `~/.abacus/instances/default/config.json` |
| Database | `~/.abacus/instances/default/db` |
| Logs | `~/.abacus/instances/default/logs` |
| Storage | `~/.abacus/instances/default/data/storage` |
| Secrets key | `~/.abacus/instances/default/secrets/master.key` |

Override with:

```sh
ABACUS_HOME=/custom/home ABACUS_INSTANCE_ID=dev pnpm abacus run
```

Or pass `--data-dir` directly on any command:

```sh
pnpm abacus run --data-dir ./tmp/abacus-dev
pnpm abacus doctor --data-dir ./tmp/abacus-dev
```
