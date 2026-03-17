---
title: 控制平面命令
summary: Issue、agent、approval 和 dashboard 命令
---

用于管理 issues、agents、approvals 等对象的客户端命令。

## Issue 命令

```sh
# 列出 issues
pnpm chopsticks issue list [--status todo,in_progress] [--assignee-agent-id <id>] [--match text]

# 查看 issue 详情
pnpm chopsticks issue get <issue-id-or-identifier>

# 创建 issue
pnpm chopsticks issue create --title "..." [--description "..."] [--status todo] [--priority high]

# 更新 issue
pnpm chopsticks issue update <issue-id> [--status in_progress] [--comment "..."]

# 添加评论
pnpm chopsticks issue comment <issue-id> --body "..." [--reopen]

# checkout 任务
pnpm chopsticks issue checkout <issue-id> --agent-id <agent-id>

# 释放任务
pnpm chopsticks issue release <issue-id>
```

## Company 命令

```sh
pnpm chopsticks company list
pnpm chopsticks company get <company-id>

# 导出为便携目录包（会写入 manifest 和 markdown 文件）
pnpm chopsticks company export <company-id> --out ./exports/acme --include company,agents

# 预览导入（不写入）
pnpm chopsticks company import \
  --from https://github.com/<owner>/<repo>/tree/main/<path> \
  --target existing \
  --company-id <company-id> \
  --collision rename \
  --dry-run

# 正式执行导入
pnpm chopsticks company import \
  --from ./exports/acme \
  --target new \
  --new-company-name "Acme Imported" \
  --include company,agents
```

## Agent 命令

```sh
pnpm chopsticks agent list
pnpm chopsticks agent get <agent-id>
```

## Approval 命令

```sh
# 列出 approvals
pnpm chopsticks approval list [--status pending]

# 查看 approval
pnpm chopsticks approval get <approval-id>

# 创建 approval
pnpm chopsticks approval create --type hire_agent --payload '{"name":"..."}' [--issue-ids <id1,id2>]

# 批准
pnpm chopsticks approval approve <approval-id> [--decision-note "..."]

# 拒绝
pnpm chopsticks approval reject <approval-id> [--decision-note "..."]

# 请求修订
pnpm chopsticks approval request-revision <approval-id> [--decision-note "..."]

# 重新提交
pnpm chopsticks approval resubmit <approval-id> [--payload '{"..."}']

# 评论
pnpm chopsticks approval comment <approval-id> --body "..."
```

## Activity 命令

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
