---
title: Docker
summary: Docker Compose quickstart
---

Run RunEach in Docker without installing Node or pnpm locally.

## Compose Quickstart (Recommended)

```sh
docker compose -f docker-compose.quickstart.yml up --build
```

Open [http://localhost:3100](http://localhost:3100).

Defaults:

- Host port: `3100`
- Data directory: `./data/docker-runeach`

Override with environment variables:

```sh
RUNEACH_PORT=3200 RUNEACH_DATA_DIR=./data/pc \
  docker compose -f docker-compose.quickstart.yml up --build
```

## Manual Docker Build

```sh
docker build -t runeach-local .
docker run --name runeach \
  -p 3100:3100 \
  -e HOST=0.0.0.0 \
  -e RUNEACH_HOME=/runeach \
  -v "$(pwd)/data/docker-runeach:/runeach" \
  runeach-local
```

## Data Persistence

All data is persisted under the bind mount (`./data/docker-runeach`):

- Embedded PostgreSQL data
- Uploaded assets
- Local secrets key
- Agent workspace data

## Claude and Codex Adapters in Docker

The Docker image pre-installs:

- `claude` (Anthropic Claude Code CLI)
- `codex` (OpenAI Codex CLI)

Pass API keys to enable local adapter runs inside the container:

```sh
docker run --name runeach \
  -p 3100:3100 \
  -e HOST=0.0.0.0 \
  -e RUNEACH_HOME=/runeach \
  -e OPENAI_API_KEY=sk-... \
  -e ANTHROPIC_API_KEY=sk-... \
  -v "$(pwd)/data/docker-runeach:/runeach" \
  runeach-local
```

Without API keys, the app runs normally — adapter environment checks will surface missing prerequisites.
