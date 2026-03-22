---
title: 本地开发
summary: 为本地开发配置 RunEach
---

在几乎零外部依赖的前提下本地运行 RunEach。

## 前置条件

- Node.js 20+
- pnpm 9+

## 启动开发服务器

```sh
pnpm install
pnpm dev
```

这会启动：

- **API 服务**：`http://localhost:3100`
- **UI**：由 API 服务以 dev middleware 模式托管（同源）

不需要 Docker，也不需要外部数据库。RunEach 会自动启用内嵌 PostgreSQL。

## 单命令引导

首次安装时可以执行：

```sh
pnpm runeach run
```

这个命令会：

1. 在缺少配置时自动完成引导
2. 运行带修复能力的 `runeach doctor`
3. 在检查通过后启动服务

## Tailscale / 私网认证开发模式

如果你希望以 `authenticated/private` 模式运行并支持网络访问：

```sh
pnpm dev --tailscale-auth
```

这会把服务绑定到 `0.0.0.0`，以便私有网络访问。

等价别名：

```sh
pnpm dev --authenticated-private
```

允许额外的私有主机名：

```sh
pnpm runeach allowed-hostname dotta-macbook-pro
```

完整配置和排障见 [Tailscale 私网访问](/deploy/tailscale-private-access)。

## 健康检查

```sh
curl http://localhost:3100/api/health
# -> {"status":"ok"}

curl http://localhost:3100/api/companies
# -> []
```

## 重置开发数据

如果要清空本地数据并重新开始：

```sh
rm -rf ~/.runeach/instances/default/db
pnpm dev
```

## 数据位置

| Data | Path |
|------|------|
| 配置 | `~/.runeach/instances/default/config.json` |
| 数据库 | `~/.runeach/instances/default/db` |
| 存储 | `~/.runeach/instances/default/data/storage` |
| Secrets key | `~/.runeach/instances/default/secrets/master.key` |
| 日志 | `~/.runeach/instances/default/logs` |

可以通过环境变量覆盖：

```sh
RUNEACH_HOME=/custom/path RUNEACH_INSTANCE_ID=dev pnpm runeach run
```

兼容性说明：`~/.runeach` 现在是唯一默认的本地 home。旧路径不会再被自动探测；迁移时请把目录移动到 `~/.runeach`，或者显式设置 `RUNEACH_HOME`。
