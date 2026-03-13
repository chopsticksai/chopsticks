<a id="top"></a>
<a id="quickstart"></a>

<h1 align="center">SwarmifyX</h1>

<p align="center">
  <strong>全自动数字企业的底层调度系统</strong><br />
  SwarmifyX: Orchestrate Your Zero-Human Company.
</p>

<p align="center">
  <a href="README.md"><strong>English</strong></a>
</p>

<p align="center">
  <a href="#quickstart"><strong>快速开始</strong></a> ·
  <a href="https://github.com/cjc-x/swarmifyx"><strong>GitHub</strong></a> ·
  <a href="LICENSE"><strong>许可证</strong></a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" /></a>
  <a href="https://github.com/cjc-x/swarmifyx/stargazers"><img src="https://img.shields.io/github/stars/cjc-x/swarmifyx?style=flat" alt="Stars" /></a>
</p>

> SwarmifyX 基于 Paperclip fork，并继续遵循 [MIT License](LICENSE) 发布。

## 什么是 SwarmifyX？

SwarmifyX 是面向“零人类公司”的开源调度系统。

它提供一个基于 Node.js 和 React 的控制平面，用来组织和管理一组 AI 代理，把它们像真正的公司一样运行起来：有目标、有汇报关系、有预算、有审批、有周期性工作，也有可追溯的执行记录。

如果说 AI 代理是员工，那么 SwarmifyX 就是公司本身。

**管理业务目标，而不只是管理 PR。**

## SwarmifyX 解决什么问题

- 把多个不同类型的代理统一编排到同一个公司目标下。
- 把目标、任务、预算和组织结构放进同一个操作面板里。
- 让代理按心跳自动运转，而不是靠人盯着一堆终端窗口。
- 在一个控制台里查看审批、成本、失败记录和执行状态。
- 在保持自动化效率的同时，保留清晰的审计和治理能力。

## 核心特性

- **自带代理，统一编排**：支持 OpenClaw、Claude Code、Codex、Cursor、本地进程和 HTTP 驱动的运行时。
- **目标驱动执行**：任务可以一路关联到项目、目标和公司级使命。
- **心跳与委派机制**：代理按计划唤醒、检查工作，并沿组织结构上下委派任务。
- **成本控制**：为每个代理设置预算，防止失控消耗。
- **治理与审批**：支持招聘审批、暂停任务、人工介入和运营控制。
- **多公司隔离**：同一套部署可以承载多个公司，并保持数据边界清晰。
- **任务化追踪**：评论、工具调用、运行输出和历史执行都挂靠在任务上。
- **移动端可管理**：随时随地查看和管理你的自动化数字企业。

## 快速开始

当前仓库以 SwarmifyX 品牌对外呈现，底层代码仍然来自 Paperclip fork，并继续遵循 MIT License。

```bash
npx swarmifyx onboard --yes
```

或从源码启动：

```bash
git clone https://github.com/cjc-x/swarmifyx.git
cd swarmifyx
pnpm install
pnpm dev
```

启动后，API 服务默认运行在 `http://localhost:3100`。本地开发会自动创建嵌入式 PostgreSQL 数据库。

> 环境要求：Node.js 20+，pnpm 9.15+

## 常见问题

**典型部署方式是什么？**  
在本地开发中，一个 Node.js 进程会同时管理 API、UI、嵌入式 PostgreSQL 和本地文件状态。在线上环境中，你可以把 SwarmifyX 接到自己的 Postgres，再按自己的方式部署。

**可以同时运行多个公司吗？**  
可以。单个部署可以承载多个公司，并保持各自独立的数据和运营上下文。

**SwarmifyX 和 OpenClaw、Claude Code、Codex 这类代理工具有什么区别？**  
SwarmifyX 不是替代这些代理，而是把它们组织成一个公司体系，补上汇报关系、目标、预算、治理和持续上下文。

**代理会持续运行吗？**  
默认情况下，代理会在心跳计划和事件触发下运行，例如任务分配或消息提及。SwarmifyX 负责协调它们何时唤醒、拿到什么上下文，以及如何记录整个工作过程。

## 开发

```bash
pnpm dev              # 完整开发模式（API + UI，含 watch）
pnpm dev:once         # 完整开发模式（不启用文件监听）
pnpm dev:server       # 仅启动服务端
pnpm build            # 构建全部模块
pnpm typecheck        # 类型检查
pnpm test:run         # 运行测试
pnpm db:generate      # 生成数据库迁移
pnpm db:migrate       # 应用数据库迁移
```

完整开发说明见 [doc/DEVELOPING.md](doc/DEVELOPING.md)。

## 贡献

欢迎提交贡献。详细说明请见 [CONTRIBUTING.md](CONTRIBUTING.md)。
