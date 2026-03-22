---
title: 环境变量
summary: 完整环境变量参考
---

这里汇总了 RunEach 用于服务端配置的所有环境变量。

## 服务端配置

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3100` | 服务端口 |
| `HOST` | `127.0.0.1` | 服务绑定地址 |
| `DATABASE_URL` | （内嵌） | PostgreSQL 连接串 |
| `RUNEACH_HOME` | `~/.runeach` | 所有 RunEach 数据的根目录 |
| `RUNEACH_INSTANCE_ID` | `default` | 实例标识符（适合本地多实例） |
| `RUNEACH_DEPLOYMENT_MODE` | `local_trusted` | 运行模式覆盖值 |

## Secrets

| Variable | Default | Description |
|----------|---------|-------------|
| `RUNEACH_SECRETS_MASTER_KEY` | （来自文件） | 32 字节加密密钥（base64 / hex / 原始字符串） |
| `RUNEACH_SECRETS_MASTER_KEY_FILE` | `~/.runeach/.../secrets/master.key` | 密钥文件路径 |
| `RUNEACH_SECRETS_STRICT_MODE` | `false` | 是否要求敏感环境变量必须使用 secret ref |

## 代理运行时（自动注入到代理进程）

这些变量会在服务端调用代理时自动注入：

| Variable | Description |
|----------|-------------|
| `RUNEACH_AGENT_ID` | 代理唯一 ID |
| `RUNEACH_COMPANY_ID` | 公司 ID |
| `RUNEACH_API_URL` | RunEach API 基础 URL |
| `RUNEACH_API_KEY` | 用于 API 认证的短期 JWT |
| `RUNEACH_RUN_ID` | 当前心跳运行 ID |
| `RUNEACH_TASK_ID` | 触发本次唤醒的 issue |
| `RUNEACH_WAKE_REASON` | 唤醒原因 |
| `RUNEACH_WAKE_COMMENT_ID` | 触发唤醒的评论 ID |
| `RUNEACH_APPROVAL_ID` | 已解析的审批 ID |
| `RUNEACH_APPROVAL_STATUS` | 审批决策结果 |
| `RUNEACH_LINKED_ISSUE_IDS` | 以逗号分隔的关联 issue ID 列表 |

## LLM Provider Key（供适配器使用）

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key（供 Claude Local 适配器使用） |
| `OPENAI_API_KEY` | OpenAI API key（供 Codex Local 适配器使用） |
