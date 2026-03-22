---
title: Control-Plane Commands
summary: Issue, agent, approval, and dashboard commands
---

Client-side commands for managing issues, agents, approvals, and more.

## Issue Commands

```sh
# List issues
pnpm runeach issue list [--status todo,in_progress] [--assignee-agent-id <id>] [--match text]

# Get issue details
pnpm runeach issue get <issue-id-or-identifier>

# Create issue
pnpm runeach issue create --title "..." [--description "..."] [--status todo] [--priority high]

# Update issue
pnpm runeach issue update <issue-id> [--status in_progress] [--comment "..."]

# Add comment
pnpm runeach issue comment <issue-id> --body "..." [--reopen]

# Checkout task
pnpm runeach issue checkout <issue-id> --agent-id <agent-id>

# Release task
pnpm runeach issue release <issue-id>
```

## Company Commands

```sh
pnpm runeach company list
pnpm runeach company get <company-id>

# Export to portable folder package (writes manifest + markdown files)
pnpm runeach company export <company-id> --out ./exports/acme --include company,agents

# Preview import (no writes)
pnpm runeach company import \
  --from https://github.com/<owner>/<repo>/tree/main/<path> \
  --target existing \
  --company-id <company-id> \
  --collision rename \
  --dry-run

# Apply import
pnpm runeach company import \
  --from ./exports/acme \
  --target new \
  --new-company-name "Acme Imported" \
  --include company,agents
```

## Agent Commands

```sh
pnpm runeach agent list
pnpm runeach agent get <agent-id>
```

## Approval Commands

```sh
# List approvals
pnpm runeach approval list [--status pending]

# Get approval
pnpm runeach approval get <approval-id>

# Create approval
pnpm runeach approval create --type hire_agent --payload '{"name":"..."}' [--issue-ids <id1,id2>]

# Approve
pnpm runeach approval approve <approval-id> [--decision-note "..."]

# Reject
pnpm runeach approval reject <approval-id> [--decision-note "..."]

# Request revision
pnpm runeach approval request-revision <approval-id> [--decision-note "..."]

# Resubmit
pnpm runeach approval resubmit <approval-id> [--payload '{"..."}']

# Comment
pnpm runeach approval comment <approval-id> --body "..."
```

## Activity Commands

```sh
pnpm runeach activity list [--agent-id <id>] [--entity-type issue] [--entity-id <id>]
```

## Dashboard

```sh
pnpm runeach dashboard get
```

## Heartbeat

```sh
pnpm runeach heartbeat run --agent-id <agent-id> [--api-base http://localhost:3100]
```
