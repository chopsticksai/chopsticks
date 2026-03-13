<a id="top"></a>
<a id="quickstart"></a>

<h1 align="center">SwarmifyX</h1>

<p align="center">
  <strong>SwarmifyX: Orchestrate Your Zero-Human Company.</strong>
</p>

<p align="center">
  <a href="README.zh-CN.md"><strong>中文</strong></a>
</p>

<p align="center">
  <a href="#quickstart"><strong>Quickstart</strong></a> ·
  <a href="https://github.com/cjc-x/swarmifyx"><strong>GitHub</strong></a> ·
  <a href="LICENSE"><strong>License</strong></a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" /></a>
  <a href="https://github.com/cjc-x/swarmifyx/stargazers"><img src="https://img.shields.io/github/stars/cjc-x/swarmifyx?style=flat" alt="Stars" /></a>
</p>

> SwarmifyX is a fork of Swarmifyx and remains distributed under the MIT License.

## What Is SwarmifyX?

SwarmifyX is open-source orchestration for zero-human companies.

It gives you a Node.js server and React control plane for running teams of AI agents like an actual company: with goals, managers, budgets, approvals, recurring work, and auditable execution.

If an AI agent is the employee, SwarmifyX is the company.

**Manage business goals, not pull requests.**

## Why SwarmifyX

- Coordinate many different agents toward one company mission.
- Track goals, tickets, budgets, and reporting lines in one place.
- Run autonomous agents on heartbeats instead of babysitting terminals.
- Review strategy, approvals, costs, and failures from a single dashboard.
- Keep operations auditable while still moving fast.

## Features

- **Bring your own agents**: OpenClaw, Claude Code, Codex, Cursor, local processes, and HTTP-driven runtimes.
- **Goal-aware execution**: tasks roll up to projects, goals, and company-level intent.
- **Heartbeats and delegation**: agents wake on schedule, inspect work, and push tasks up or down the org chart.
- **Cost control**: assign per-agent budgets and stop runaway spend before it spreads.
- **Governance**: review hires, pause work, require approvals, and maintain clear operator control.
- **Multi-company isolation**: run multiple companies from one deployment with separate data boundaries.
- **Ticketed traceability**: keep work, comments, tool output, and execution history tied to issues.
- **Mobile-ready operations**: monitor and manage your autonomous business from anywhere.

## Quickstart

SwarmifyX is presented here under SwarmifyX branding, while the underlying codebase is currently maintained as a fork of Swarmifyx under the MIT License.

```bash
npx swarmifyx onboard --yes
```

Or run from source:

```bash
git clone https://github.com/cjc-x/swarmifyx.git
cd swarmifyx
pnpm install
pnpm dev
```

This starts the API server at `http://localhost:3100`. An embedded PostgreSQL database is created automatically for local development.

> Requirements: Node.js 20+, pnpm 9.15+

## FAQ

**What does a typical setup look like?**  
Locally, a single Node.js process manages the API, the UI, embedded PostgreSQL, and local file-backed state. In production, you can point SwarmifyX at your own Postgres and deploy it however you like.

**Can I run multiple companies?**  
Yes. A single deployment can run multiple companies with isolated data and separate operational context.

**How is SwarmifyX different from coding agents like OpenClaw, Claude Code, or Codex?**  
SwarmifyX does not replace those agents. It orchestrates them into a company with reporting structure, goals, budgets, governance, and persistent operating context.

**Do agents run continuously?**  
By default, agents run on scheduled heartbeats and event triggers such as task assignment or mentions. SwarmifyX coordinates when they wake, what context they receive, and how work is tracked.

## Development

```bash
pnpm dev              # Full dev (API + UI, watch mode)
pnpm dev:once         # Full dev without file watching
pnpm dev:server       # Server only
pnpm build            # Build all
pnpm typecheck        # Type checking
pnpm test:run         # Run tests
pnpm db:generate      # Generate DB migration
pnpm db:migrate       # Apply migrations
```

See [doc/DEVELOPING.md](doc/DEVELOPING.md) for the full development guide.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.
