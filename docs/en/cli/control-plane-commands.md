---
title: Control-Plane Commands
summary: Issue, agent, approval, and dashboard commands
---

Client-side commands for managing issues, agents, approvals, and more.

## Issue Commands

```sh
# List issues
pnpm abacus issue list [--status todo,in_progress] [--assignee-agent-id <id>] [--match text]

# Get issue details
pnpm abacus issue get <issue-id-or-identifier>

# Create issue
pnpm abacus issue create --title "..." [--description "..."] [--status todo] [--priority high]

# Update issue
pnpm abacus issue update <issue-id> [--status in_progress] [--comment "..."]

# Add comment
pnpm abacus issue comment <issue-id> --body "..." [--reopen]

# Checkout task
pnpm abacus issue checkout <issue-id> --agent-id <agent-id>

# Release task
pnpm abacus issue release <issue-id>
```

## Company Commands

```sh
pnpm abacus company list
pnpm abacus company get <company-id>

# Export to portable folder package (writes manifest + markdown files)
pnpm abacus company export <company-id> --out ./exports/acme --include company,agents

# Preview import (no writes)
pnpm abacus company import \
  --from https://github.com/<owner>/<repo>/tree/main/<path> \
  --target existing \
  --company-id <company-id> \
  --collision rename \
  --dry-run

# Apply import
pnpm abacus company import \
  --from ./exports/acme \
  --target new \
  --new-company-name "Acme Imported" \
  --include company,agents
```

## Agent Commands

```sh
pnpm abacus agent list
pnpm abacus agent get <agent-id>
```

## Approval Commands

```sh
# List approvals
pnpm abacus approval list [--status pending]

# Get approval
pnpm abacus approval get <approval-id>

# Create approval
pnpm abacus approval create --type hire_agent --payload '{"name":"..."}' [--issue-ids <id1,id2>]

# Approve
pnpm abacus approval approve <approval-id> [--decision-note "..."]

# Reject
pnpm abacus approval reject <approval-id> [--decision-note "..."]

# Request revision
pnpm abacus approval request-revision <approval-id> [--decision-note "..."]

# Resubmit
pnpm abacus approval resubmit <approval-id> [--payload '{"..."}']

# Comment
pnpm abacus approval comment <approval-id> --body "..."
```

## Activity Commands

```sh
pnpm abacus activity list [--agent-id <id>] [--entity-type issue] [--entity-id <id>]
```

## Dashboard

```sh
pnpm abacus dashboard get
```

## Heartbeat

```sh
pnpm abacus heartbeat run --agent-id <agent-id> [--api-base http://localhost:3100]
```
