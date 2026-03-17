---
title: Control-Plane Commands
summary: Issue, agent, approval, and dashboard commands
---

Client-side commands for managing issues, agents, approvals, and more.

## Issue Commands

```sh
# List issues
pnpm chopsticks issue list [--status todo,in_progress] [--assignee-agent-id <id>] [--match text]

# Get issue details
pnpm chopsticks issue get <issue-id-or-identifier>

# Create issue
pnpm chopsticks issue create --title "..." [--description "..."] [--status todo] [--priority high]

# Update issue
pnpm chopsticks issue update <issue-id> [--status in_progress] [--comment "..."]

# Add comment
pnpm chopsticks issue comment <issue-id> --body "..." [--reopen]

# Checkout task
pnpm chopsticks issue checkout <issue-id> --agent-id <agent-id>

# Release task
pnpm chopsticks issue release <issue-id>
```

## Company Commands

```sh
pnpm chopsticks company list
pnpm chopsticks company get <company-id>

# Export to portable folder package (writes manifest + markdown files)
pnpm chopsticks company export <company-id> --out ./exports/acme --include company,agents

# Preview import (no writes)
pnpm chopsticks company import \
  --from https://github.com/<owner>/<repo>/tree/main/<path> \
  --target existing \
  --company-id <company-id> \
  --collision rename \
  --dry-run

# Apply import
pnpm chopsticks company import \
  --from ./exports/acme \
  --target new \
  --new-company-name "Acme Imported" \
  --include company,agents
```

## Agent Commands

```sh
pnpm chopsticks agent list
pnpm chopsticks agent get <agent-id>
```

## Approval Commands

```sh
# List approvals
pnpm chopsticks approval list [--status pending]

# Get approval
pnpm chopsticks approval get <approval-id>

# Create approval
pnpm chopsticks approval create --type hire_agent --payload '{"name":"..."}' [--issue-ids <id1,id2>]

# Approve
pnpm chopsticks approval approve <approval-id> [--decision-note "..."]

# Reject
pnpm chopsticks approval reject <approval-id> [--decision-note "..."]

# Request revision
pnpm chopsticks approval request-revision <approval-id> [--decision-note "..."]

# Resubmit
pnpm chopsticks approval resubmit <approval-id> [--payload '{"..."}']

# Comment
pnpm chopsticks approval comment <approval-id> --body "..."
```

## Activity Commands

```sh
pnpm chopsticks activity list [--agent-id <id>] [--entity-type issue] [--entity-id <id>]
```

## Dashboard

```sh
pnpm chopsticks dashboard get
```

## Heartbeat

```sh
pnpm chopsticks heartbeat run --agent-id <agent-id> [--api-base http://localhost:3100]
```
