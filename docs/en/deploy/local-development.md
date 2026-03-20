---
title: Local Development
summary: Set up Abacus for local development
---

Run Abacus locally with zero external dependencies.

## Prerequisites

- Node.js 20+
- pnpm 9+

## Start Dev Server

```sh
pnpm install
pnpm dev
```

This starts:

- **API server** at `http://localhost:3100`
- **UI** served by the API server in dev middleware mode (same origin)

No Docker or external database required. Abacus uses embedded PostgreSQL automatically.

## One-Command Bootstrap

For a first-time install:

```sh
pnpm abacus run
```

This does:

1. Auto-onboards if config is missing
2. Runs `abacus doctor` with repair enabled
3. Starts the server when checks pass

## Tailscale/Private Auth Dev Mode

To run in `authenticated/private` mode for network access:

```sh
pnpm dev --tailscale-auth
```

This binds the server to `0.0.0.0` for private-network access.

Alias:

```sh
pnpm dev --authenticated-private
```

Allow additional private hostnames:

```sh
pnpm abacus allowed-hostname dotta-macbook-pro
```

For full setup and troubleshooting, see [Tailscale Private Access](/en/deploy/tailscale-private-access).

## Health Checks

```sh
curl http://localhost:3100/api/health
# -> {"status":"ok"}

curl http://localhost:3100/api/companies
# -> []
```

## Reset Dev Data

To wipe local data and start fresh:

```sh
rm -rf ~/.abacus/instances/default/db
pnpm dev
```

## Data Locations

| Data | Path |
|------|------|
| Config | `~/.abacus/instances/default/config.json` |
| Database | `~/.abacus/instances/default/db` |
| Storage | `~/.abacus/instances/default/data/storage` |
| Secrets key | `~/.abacus/instances/default/secrets/master.key` |
| Logs | `~/.abacus/instances/default/logs` |

Override with environment variables:

```sh
ABACUS_HOME=/custom/path ABACUS_INSTANCE_ID=dev pnpm abacus run
```

Compatibility note: `~/.abacus` is now the only default local home. Legacy `~/.abacus` homes are no longer auto-detected; move the directory to `~/.abacus` or set `ABACUS_HOME` explicitly during migration.
