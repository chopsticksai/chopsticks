import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

const API_BASE = (process.env.CHOPSTICKS_API_BASE ?? "http://127.0.0.1:3100/api").replace(/\/$/, "");
const UI_BASE = (process.env.CHOPSTICKS_UI_BASE ?? "http://localhost:3100").replace(/\/$/, "");
const COMPANY_NAME = process.env.CHOPSTICKS_COMPANY_NAME ?? "TradingAgents";
const MODEL = process.env.CHOPSTICKS_TRADING_MODEL ?? "glm-5.0";
const POLL_INTERVAL_MS = Number.parseInt(process.env.CHOPSTICKS_POLL_INTERVAL_MS ?? "1500", 10);
const AUTO_WAKE_WAIT_MS = Number.parseInt(process.env.CHOPSTICKS_AUTO_WAKE_WAIT_MS ?? "15000", 10);
const RUN_TIMEOUT_MS = Number.parseInt(process.env.CHOPSTICKS_HEARTBEAT_TIMEOUT_MS ?? "180000", 10);
const MAX_TURNS_PER_RUN = Number.parseInt(process.env.CHOPSTICKS_MAX_TURNS_PER_RUN ?? "12", 10);
const HEARTBEAT_RUN_LIST_LIMIT = Number.parseInt(
  process.env.CHOPSTICKS_HEARTBEAT_RUN_LIST_LIMIT ?? "500",
  10,
);
const OBSERVE_DESCENDANTS = process.env.CHOPSTICKS_OBSERVE_DESCENDANTS === "true";
const DESCENDANT_TIMEOUT_MS = Number.parseInt(
  process.env.CHOPSTICKS_DESCENDANT_TIMEOUT_MS ?? "240000",
  10,
);
const DESCENDANT_SETTLE_MS = Number.parseInt(
  process.env.CHOPSTICKS_DESCENDANT_SETTLE_MS ?? "12000",
  10,
);
const SKIP_RUN = process.env.CHOPSTICKS_SKIP_RUN === "true";
const INSTRUCTIONS_FILE_PATH = path.resolve(__dirname, "shared-agent-instructions.md");

const TERMINAL_RUN_STATUSES = new Set(["succeeded", "failed", "cancelled", "timed_out"]);
const LIVE_RUN_STATUSES = new Set(["queued", "running"]);

const AGENTS = [
  {
    ref: "pm",
    name: "投资组合经理",
    role: "ceo",
    title: "投资组合经理 (CEO)",
    icon: "crown",
    reportsToRef: null,
    capabilities: "最终决策，审批交易提案，管理整体投资组合。",
    recommendedSkills: ["chopsticks", "para-memory-files"],
  },
  {
    ref: "rm",
    name: "风险管理员",
    role: "general",
    title: "风险管理团队",
    icon: "shield",
    reportsToRef: "pm",
    capabilities: "评估市场波动性、流动性与仓位风险，并持续监控异常暴露。",
    recommendedSkills: ["chopsticks", "ssh-mcp"],
  },
  {
    ref: "tr",
    name: "交易员",
    role: "general",
    title: "交易员代理",
    icon: "zap",
    reportsToRef: "pm",
    capabilities: "整合研究结论，决定交易时机和规模，并执行交易计划。",
    recommendedSkills: ["chopsticks", "para-memory-files"],
  },
  {
    ref: "lr",
    name: "多头研究员",
    role: "researcher",
    title: "多头研究员",
    icon: "telescope",
    reportsToRef: "pm",
    capabilities: "整合分析师结论，寻找做多机会，并构建正向投资论点。",
    recommendedSkills: ["chopsticks", "para-memory-files"],
  },
  {
    ref: "sr",
    name: "空头研究员",
    role: "researcher",
    title: "空头研究员",
    icon: "microscope",
    reportsToRef: "pm",
    capabilities: "寻找做空机会，对多头结论提出反证与批判性辩论。",
    recommendedSkills: ["chopsticks", "para-memory-files"],
  },
  {
    ref: "fa",
    name: "基本面分析师",
    role: "researcher",
    title: "基本面分析师",
    icon: "file-code",
    reportsToRef: "lr",
    capabilities: "评估公司财务、业绩指标、估值与基本面拐点。",
    recommendedSkills: [
      "sugarforever/01coder-agent-skills@china-stock-analysis",
      "nicepkg/ai-workflow@a-share-analysis",
    ],
  },
  {
    ref: "sa",
    name: "情绪分析师",
    role: "researcher",
    title: "情绪分析师",
    icon: "heart",
    reportsToRef: "lr",
    capabilities: "监控社交媒体、论坛和市场情绪，提炼情绪驱动信号。",
    recommendedSkills: ["omer-metin/skills-for-antigravity@sentiment-analysis-trading"],
  },
  {
    ref: "na",
    name: "新闻分析师",
    role: "researcher",
    title: "新闻分析师",
    icon: "globe",
    reportsToRef: "lr",
    capabilities: "跟踪政策、宏观与公司新闻，提炼对股价的事件驱动影响。",
    recommendedSkills: [
      "nanmicoder/newscrawler@china-news-crawler",
      "skills.volces.com@a-share-daily-report",
    ],
  },
  {
    ref: "ta",
    name: "技术分析师",
    role: "researcher",
    title: "技术分析师",
    icon: "radar",
    reportsToRef: "lr",
    capabilities: "分析 MACD、RSI、趋势、成交量与关键支撑阻力位。",
    recommendedSkills: ["ssh-mcp"],
  },
];

const DIRECT_REPORTS_BY_REF = new Map(
  AGENTS.map((agent) => [
    agent.ref,
    AGENTS.filter((candidate) => candidate.reportsToRef === agent.ref),
  ]),
);

function logStep(message) {
  console.log(`\n▶ ${message}`);
}

function logInfo(message) {
  console.log(`   ${message}`);
}

function logWarn(message) {
  console.log(`   [warn] ${message}`);
}

function toErrorMessage(error) {
  if (error instanceof Error) return error.message;
  return String(error);
}

function summarizePayload(payload) {
  if (typeof payload === "string") return payload;
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

async function apiFetch(endpoint, init = {}) {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;
  const headers = new Headers(init.headers ?? {});

  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...init,
    headers,
    body:
      init.body === undefined || typeof init.body === "string"
        ? init.body
        : JSON.stringify(init.body),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(`${init.method ?? "GET"} ${url} failed (${response.status}): ${summarizePayload(payload)}`);
  }

  return payload;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function getDirectReports(agentRef) {
  return DIRECT_REPORTS_BY_REF.get(agentRef) ?? [];
}

function buildAgentPromptTemplate(agent) {
  const directReports = getDirectReports(agent.ref);
  const directReportNames = directReports.map((item) => item.name).join("、");
  const commonLines = [
    "You are running a Chopsticks TradingAgents smoke test.",
    "Chopsticks task == issue. Never use /api/tasks/*.",
    "Do not use the chopsticks Skill tool in this run.",
    "Do not call /api/agents/me. Use CHOPSTICKS_AGENT_ID, CHOPSTICKS_COMPANY_ID, and CHOPSTICKS_TASK_ID from the environment as authoritative.",
    "Use direct loopback REST calls to $CHOPSTICKS_API_URL/api/... and include X-Chopsticks-Run-Id on mutating requests for this run.",
    "Prefer one compact Bash script or as few tool calls as possible. Do not narrate every step or print large JSON payloads unless needed.",
    `Your Chopsticks agent name is ${agent.name}.`,
  ];

  if (directReports.length > 0) {
    return [
      ...commonLines,
      `Your direct reports available for delegation are: ${directReportNames}.`,
      "This run is a manager smoke step. Keep it short and auditable.",
      "Required sequence:",
      "1. GET /api/issues/$CHOPSTICKS_TASK_ID",
      "2. GET /api/companies/$CHOPSTICKS_COMPANY_ID/agents once and resolve the exact ids of your direct reports from the org chart.",
      "3. POST /api/issues/$CHOPSTICKS_TASK_ID/checkout with agentId=$CHOPSTICKS_AGENT_ID and expectedStatuses=[\"todo\",\"backlog\",\"blocked\"].",
      "4. Create at most 3 child issues for your direct reports only via POST /api/companies/$CHOPSTICKS_COMPANY_ID/issues, always setting status=\"todo\" and assigneeAgentId to the exact direct report id.",
      "5. Write one concise Chinese delegation update via PATCH /api/issues/$CHOPSTICKS_TASK_ID with a comment field. Do not use POST /api/issues/$CHOPSTICKS_TASK_ID/comments for this smoke test.",
      "6. Stop immediately after the delegation update. Do not wait for subordinate results in this run.",
      "If an endpoint returns an error, do not guess alternative routes beyond the exact /api/issues/... and /api/companies/... endpoints above.",
    ].join("\n");
  }

  return [
    ...commonLines,
    "You have no direct reports in this org chart.",
    "This run is an individual contributor smoke step. Keep it short and auditable.",
    "Required sequence:",
    "1. GET /api/issues/$CHOPSTICKS_TASK_ID",
    "2. POST /api/issues/$CHOPSTICKS_TASK_ID/checkout with agentId=$CHOPSTICKS_AGENT_ID and expectedStatuses=[\"todo\",\"backlog\",\"blocked\"].",
    "3. Finish with one concise Chinese findings-or-blocker update via PATCH /api/issues/$CHOPSTICKS_TASK_ID using status=\"done\" and a comment field. Do not use POST /api/issues/$CHOPSTICKS_TASK_ID/comments for this smoke test.",
    "4. Stop immediately after the PATCH. Do not create child issues.",
    "If an endpoint returns an error, do not guess alternative routes beyond the exact /api/issues/... endpoints above.",
  ].join("\n");
}

function buildAgentAdapterConfig(agent) {
  return {
    cwd: repoRoot,
    instructionsFilePath: INSTRUCTIONS_FILE_PATH,
    model: MODEL,
    maxTurnsPerRun: MAX_TURNS_PER_RUN,
    dangerouslySkipPermissions: true,
    timeoutSec: Math.max(60, Math.floor(RUN_TIMEOUT_MS / 1000)),
    promptTemplate: buildAgentPromptTemplate(agent),
  };
}

function extractTerminalResultFromStdout(stdoutText) {
  if (typeof stdoutText !== "string" || stdoutText.trim().length === 0) {
    return null;
  }

  const lines = stdoutText.trim().split(/\r?\n/).reverse();
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (parsed && parsed.type === "result") {
        return parsed;
      }
    } catch {
      // ignore non-JSON lines
    }
  }

  return null;
}

function extractRunErrorDetail(run) {
  const result = run?.resultJson;
  if (!result || typeof result !== "object") return run?.error ?? null;

  if (Array.isArray(result.errors) && result.errors.length > 0) {
    return result.errors.map((item) => String(item)).join(" | ");
  }

  const terminalResult = extractTerminalResultFromStdout(result.stdout);
  if (terminalResult && Array.isArray(terminalResult.errors) && terminalResult.errors.length > 0) {
    return terminalResult.errors.map((item) => String(item)).join(" | ");
  }

  if (typeof result.result === "string" && result.result.trim()) {
    return result.result.trim();
  }

  return run?.error ?? null;
}

function getRunIssueId(run) {
  const context = run?.contextSnapshot;
  if (!context || typeof context !== "object") return null;
  return typeof context.issueId === "string" && context.issueId.trim().length > 0
    ? context.issueId
    : null;
}

function countBy(items, selector) {
  const counts = {};
  for (const item of items) {
    const key = selector(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function collectIssueTree(allIssues, rootIssueId) {
  const byId = new Map(allIssues.map((issue) => [issue.id, issue]));
  const childrenByParentId = new Map();

  for (const issue of allIssues) {
    const parentId = issue.parentId ?? null;
    const children = childrenByParentId.get(parentId) ?? [];
    children.push(issue);
    childrenByParentId.set(parentId, children);
  }

  const rootIssue = byId.get(rootIssueId);
  if (!rootIssue) {
    return {
      issues: [],
      depths: new Map(),
      childrenByParentId,
    };
  }

  const queue = [{ issue: rootIssue, depth: 0 }];
  const visited = new Set();
  const ordered = [];
  const depths = new Map();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current.issue.id)) continue;
    visited.add(current.issue.id);
    ordered.push(current.issue);
    depths.set(current.issue.id, current.depth);

    const children = childrenByParentId.get(current.issue.id) ?? [];
    children.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    for (const child of children) {
      queue.push({ issue: child, depth: current.depth + 1 });
    }
  }

  return {
    issues: ordered,
    depths,
    childrenByParentId,
  };
}

async function waitForHeartbeatRun(companyId, agentId, timeoutMs) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const runs = await apiFetch(`/companies/${companyId}/heartbeat-runs?agentId=${agentId}&limit=20`);
    if (Array.isArray(runs) && runs.length > 0) {
      return runs[0];
    }
    await sleep(POLL_INTERVAL_MS);
  }

  return null;
}

async function waitForRunTerminal(runId, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastStatus = null;

  while (Date.now() < deadline) {
    const run = await apiFetch(`/heartbeat-runs/${runId}`);
    if (run.status !== lastStatus) {
      logInfo(`heartbeat 状态 -> ${run.status}`);
      lastStatus = run.status;
    }

    if (TERMINAL_RUN_STATUSES.has(run.status)) {
      return run;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(`Heartbeat run ${runId} did not reach a terminal state within ${timeoutMs}ms`);
}

async function fetchRunLogExcerpt(runId, limitBytes = 12000) {
  const result = await apiFetch(`/heartbeat-runs/${runId}/log?offset=0&limitBytes=${limitBytes}`);
  return typeof result?.content === "string" ? result.content.trim() : "";
}

async function fetchHeartbeatRuns(companyId, limit = HEARTBEAT_RUN_LIST_LIMIT) {
  const result = await apiFetch(`/companies/${companyId}/heartbeat-runs?limit=${limit}`);
  return Array.isArray(result) ? result : [];
}

async function fetchCompanyIssues(companyId) {
  const result = await apiFetch(`/companies/${companyId}/issues`);
  return Array.isArray(result) ? result : [];
}

async function fetchIssueCommentCount(issueId) {
  const comments = await apiFetch(`/issues/${issueId}/comments?order=asc&limit=200`);
  return Array.isArray(comments) ? comments.length : 0;
}

async function createCompany() {
  const description = [
    "TradingAgents smoke test company.",
    `Created at ${new Date().toISOString()}.`,
  ].join(" ");

  return apiFetch("/companies", {
    method: "POST",
    body: {
      name: COMPANY_NAME,
      description,
    },
  });
}

async function testAdapterEnvironment(companyId, agent) {
  return apiFetch(`/companies/${companyId}/adapters/codebuddy_local/test-environment`, {
    method: "POST",
    body: {
      adapterConfig: buildAgentAdapterConfig(agent),
    },
  });
}

async function createAgents(companyId) {
  const agentIdsByRef = {};

  for (const agent of AGENTS) {
    const reportsTo = agent.reportsToRef ? agentIdsByRef[agent.reportsToRef] ?? null : null;
    assert(
      agent.reportsToRef === null || typeof reportsTo === "string",
      `Agent ${agent.name} is missing parent id for ref ${agent.reportsToRef}`,
    );

    const created = await apiFetch(`/companies/${companyId}/agents`, {
      method: "POST",
      body: {
        name: agent.name,
        role: agent.role,
        title: agent.title,
        icon: agent.icon,
        reportsTo,
        capabilities: agent.capabilities,
        adapterType: "codebuddy_local",
        adapterConfig: buildAgentAdapterConfig(agent),
        metadata: {
          scenario: "trading_agents_smoke",
          agentRef: agent.ref,
          smokeRole: getDirectReports(agent.ref).length > 0 ? "manager" : "individual_contributor",
          recommendedSkills: agent.recommendedSkills,
        },
      },
    });

    agentIdsByRef[agent.ref] = created.id;
    logInfo(`已创建 agent: ${agent.name} (${created.id})`);
  }

  return agentIdsByRef;
}

async function validateAgents(companyId, agentIdsByRef) {
  const agents = await apiFetch(`/companies/${companyId}/agents`);
  assert(Array.isArray(agents), "Agent list response is not an array");
  assert(agents.length === AGENTS.length, `Expected ${AGENTS.length} agents, received ${agents.length}`);

  for (const definition of AGENTS) {
    const agent = agents.find((item) => item.id === agentIdsByRef[definition.ref]);
    assert(agent, `Missing agent in list response: ${definition.name}`);
    assert(agent.adapterType === "codebuddy_local", `Agent ${definition.name} adapterType mismatch`);
    assert(agent.status === "idle", `Agent ${definition.name} should start in idle status, got ${agent.status}`);

    const expectedParentId = definition.reportsToRef ? agentIdsByRef[definition.reportsToRef] : null;
    assert(
      (agent.reportsTo ?? null) === expectedParentId,
      `Agent ${definition.name} reportsTo mismatch: expected ${expectedParentId}, got ${agent.reportsTo ?? null}`,
    );
  }

  return agents;
}

async function createSmokeIssue(companyId, pmId) {
  return apiFetch(`/companies/${companyId}/issues`, {
    method: "POST",
    body: {
      title: "分析比亚迪(002594)股票并输出协作研究结论",
      description: [
        "请围绕比亚迪(002594)组织一次首轮协作研究启动。",
        "",
        "本 smoke test 只要求完成第一轮管理动作，不要求在本轮 heartbeat 内拿到最终结论。",
        "",
        "交付要求：",
        "1. 拆分出适合下属执行的子任务并分配给直接下属。",
        "2. 在父 issue comments 中发布一条中文分工说明和下一步计划。",
        "3. 完成拆解后即可结束本轮 heartbeat，不要在本轮等待所有子任务完成。",
        "",
        "建议优先分派给直接下属：风险管理员、交易员、多头研究员。",
        "如果多头研究员需要继续拆解，可进一步分派给基本面、情绪、新闻、技术分析师。",
      ].join("\n"),
      status: "todo",
      priority: "high",
      assigneeAgentId: pmId,
    },
  });
}

async function listIssueChildren(companyId, parentIssueId) {
  const issues = await fetchCompanyIssues(companyId);
  return issues.filter((issue) => issue.parentId === parentIssueId);
}

async function summarizeAdapterChecks(result) {
  if (!result || !Array.isArray(result.checks)) return;

  logInfo(`adapter 环境检查结果: ${result.status}`);
  for (const check of result.checks) {
    const detail = check.detail ? ` | ${check.detail}` : "";
    logInfo(`[${check.level}] ${check.code}: ${check.message}${detail}`);
  }
}

async function observeDescendantExecution({
  companyId,
  rootIssueId,
  rootRunId,
  agentNameById,
  timeoutMs,
  settleMs,
}) {
  logStep("观测子任务与下游 agent 执行");

  const knownIssueStates = new Map();
  const knownRunStates = new Map();
  const deadline = Date.now() + timeoutMs;
  let lastProgressAt = Date.now();

  while (Date.now() < deadline) {
    const [allIssues, allRuns] = await Promise.all([
      fetchCompanyIssues(companyId),
      fetchHeartbeatRuns(companyId),
    ]);

    const topology = collectIssueTree(allIssues, rootIssueId);
    const descendantIssues = topology.issues.filter((issue) => issue.id !== rootIssueId);
    const descendantIssueIds = new Set(descendantIssues.map((issue) => issue.id));
    const relevantRuns = allRuns.filter((run) => {
      const issueId = getRunIssueId(run);
      return issueId && descendantIssueIds.has(issueId) && run.id !== rootRunId;
    });
    let observedProgress = false;

    for (const issue of descendantIssues) {
      const previousState = knownIssueStates.get(issue.id);
      const nextState = {
        status: issue.status,
        assigneeAgentId: issue.assigneeAgentId ?? null,
        updatedAt: issue.updatedAt,
      };

      if (!previousState) {
        const depth = topology.depths.get(issue.id) ?? 0;
        logInfo(
          `发现子任务: ${issue.identifier ?? issue.id} | depth=${depth} | assignee=${
            agentNameById[issue.assigneeAgentId] ?? issue.assigneeAgentId ?? "unassigned"
          } | status=${issue.status}`,
        );
        knownIssueStates.set(issue.id, nextState);
        observedProgress = true;
        continue;
      }

      if (
        previousState.status !== nextState.status ||
        previousState.assigneeAgentId !== nextState.assigneeAgentId ||
        previousState.updatedAt !== nextState.updatedAt
      ) {
        logInfo(
          `任务变化: ${issue.identifier ?? issue.id} | status ${previousState.status} -> ${nextState.status}`,
        );
        knownIssueStates.set(issue.id, nextState);
        observedProgress = true;
      }
    }

    for (const run of relevantRuns) {
      const previousStatus = knownRunStates.get(run.id);
      if (!previousStatus) {
        const issueId = getRunIssueId(run);
        const issue = issueId ? topology.issues.find((item) => item.id === issueId) : null;
        logInfo(
          `下游 run: ${run.id} | agent=${agentNameById[run.agentId] ?? run.agentId} | issue=${
            issue?.identifier ?? issueId ?? "unknown"
          } | status=${run.status}`,
        );
        knownRunStates.set(run.id, run.status);
        observedProgress = true;
        continue;
      }

      if (previousStatus !== run.status) {
        logInfo(
          `run 状态变化: ${run.id} | ${previousStatus} -> ${run.status} | agent=${
            agentNameById[run.agentId] ?? run.agentId
          }`,
        );
        knownRunStates.set(run.id, run.status);
        observedProgress = true;
      }
    }

    if (observedProgress) {
      lastProgressAt = Date.now();
    }

    const liveRelevantRuns = relevantRuns.filter((run) => LIVE_RUN_STATUSES.has(run.status));
    if (descendantIssues.length === 0 && Date.now() - lastProgressAt >= settleMs) {
      break;
    }
    if (
      descendantIssues.length > 0 &&
      liveRelevantRuns.length === 0 &&
      Date.now() - lastProgressAt >= settleMs
    ) {
      break;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  const finalIssues = await fetchCompanyIssues(companyId);
  const finalRuns = await fetchHeartbeatRuns(companyId);
  const topology = collectIssueTree(finalIssues, rootIssueId);
  const descendantIssues = topology.issues.filter((issue) => issue.id !== rootIssueId);
  const descendantIssueIds = new Set(descendantIssues.map((issue) => issue.id));
  const relevantRuns = finalRuns.filter((run) => {
    const issueId = getRunIssueId(run);
    return issueId && descendantIssueIds.has(issueId) && run.id !== rootRunId;
  });

  const commentCounts = new Map(
    await Promise.all(
      descendantIssues.map(async (issue) => [issue.id, await fetchIssueCommentCount(issue.id)]),
    ),
  );

  const issueSummaries = descendantIssues.map((issue) => ({
    id: issue.id,
    identifier: issue.identifier ?? null,
    title: issue.title,
    depth: topology.depths.get(issue.id) ?? null,
    status: issue.status,
    assigneeAgentId: issue.assigneeAgentId ?? null,
    assigneeAgentName: agentNameById[issue.assigneeAgentId] ?? null,
    commentCount: commentCounts.get(issue.id) ?? 0,
    childIssueCount: (topology.childrenByParentId.get(issue.id) ?? []).length,
  }));

  const assignedIssuesWithoutRuns = issueSummaries.filter((issue) => {
    if (!issue.assigneeAgentId) return false;
    if (issue.status === "backlog" || issue.status === "done" || issue.status === "cancelled") {
      return false;
    }
    return !relevantRuns.some((run) => getRunIssueId(run) === issue.id);
  });
  const unassignedIssues = issueSummaries.filter((issue) => issue.assigneeAgentId == null);

  const warnings = [];
  if (issueSummaries.length === 0) {
    warnings.push("PM 未继续拆出任何子任务，无法观察下游执行。");
  }
  if (issueSummaries.length > 0 && relevantRuns.length === 0) {
    warnings.push("已经存在子任务，但未观察到任何下游 heartbeat run。");
  }
  if (assignedIssuesWithoutRuns.length > 0) {
    warnings.push(
      `存在 ${assignedIssuesWithoutRuns.length} 个已分配子任务仍未出现 run: ${assignedIssuesWithoutRuns
        .map((issue) => issue.identifier ?? issue.id)
        .join(", ")}`,
    );
  }
  if (unassignedIssues.length > 0) {
    warnings.push(
      `存在 ${unassignedIssues.length} 个未分配子任务: ${unassignedIssues
        .map((issue) => issue.identifier ?? issue.id)
        .join(", ")}`,
    );
  }

  return {
    enabled: true,
    observedIssueCount: issueSummaries.length,
    observedRunCount: relevantRuns.length,
    issueStatusCounts: countBy(issueSummaries, (issue) => issue.status),
    runStatusCounts: countBy(relevantRuns, (run) => run.status),
    maxDepth: issueSummaries.reduce((maxDepth, issue) => Math.max(maxDepth, issue.depth ?? 0), 0),
    issues: issueSummaries,
    runs: relevantRuns.map((run) => ({
      id: run.id,
      issueId: getRunIssueId(run),
      issueIdentifier:
        issueSummaries.find((issue) => issue.id === getRunIssueId(run))?.identifier ?? null,
      agentId: run.agentId,
      agentName: agentNameById[run.agentId] ?? null,
      status: run.status,
      source: run.invocationSource,
      triggerDetail: run.triggerDetail,
      error: extractRunErrorDetail(run),
    })),
    warnings,
  };
}

async function main() {
  logStep("检查 Chopsticks 服务健康状态");
  const health = await apiFetch("/health");
  assert(health.status === "ok", `Health check failed: ${summarizePayload(health)}`);
  logInfo(`服务正常，deploymentMode=${health.deploymentMode}`);

  logStep("创建测试公司");
  const company = await createCompany();
  logInfo(`公司已创建: ${company.name} (${company.id})`);
  logInfo(`issuePrefix=${company.issuePrefix}, requireBoardApprovalForNewAgents=${company.requireBoardApprovalForNewAgents}`);

  logStep("检查 codebuddy_local 运行环境");
  const adapterEnvironment = await testAdapterEnvironment(company.id, AGENTS[0]);
  await summarizeAdapterChecks(adapterEnvironment);

  logStep("创建 TradingAgents 团队");
  const agentIdsByRef = await createAgents(company.id);

  logStep("校验 agent 数量、适配器类型与汇报关系");
  const createdAgents = await validateAgents(company.id, agentIdsByRef);
  const agentNameById = Object.fromEntries(createdAgents.map((agent) => [agent.id, agent.name]));
  logInfo(`已验证 ${createdAgents.length} 个 agents`);

  logStep("创建主研究任务");
  const smokeIssue = await createSmokeIssue(company.id, agentIdsByRef.pm);
  logInfo(`主任务已创建: ${smokeIssue.identifier ?? smokeIssue.id} - ${smokeIssue.title}`);
  logInfo("预期行为: issue 创建后自动唤醒投资组合经理处理任务。");

  let wakeStrategy = "skipped";
  let run = null;

  if (!SKIP_RUN) {
    logStep("观测自动唤醒是否产生 heartbeat run");
    run = await waitForHeartbeatRun(company.id, agentIdsByRef.pm, AUTO_WAKE_WAIT_MS);

    if (run) {
      wakeStrategy = "automatic";
      logInfo(`观察到自动创建的 run: ${run.id}`);
    } else {
      wakeStrategy = "manual_fallback";
      logInfo("在等待窗口内未观察到自动 run，触发一次手动 wakeup 作为兜底。");
      const wakeResponse = await apiFetch(`/agents/${agentIdsByRef.pm}/wakeup`, {
        method: "POST",
        body: {
          source: "on_demand",
          triggerDetail: "manual",
          reason: "trading_agents_smoke_manual_fallback",
          payload: {
            issueId: smokeIssue.id,
            taskId: smokeIssue.id,
          },
        },
      });

      if (wakeResponse?.status === "skipped") {
        logInfo("手动 wakeup 返回 skipped，继续查询现有 runs。");
        run = await waitForHeartbeatRun(company.id, agentIdsByRef.pm, AUTO_WAKE_WAIT_MS);
      } else {
        run = wakeResponse;
      }
    }
  } else {
    logInfo("已通过 CHOPSTICKS_SKIP_RUN=true 跳过运行阶段。");
  }

  let finalRun = null;
  let runLogExcerpt = "";

  if (run) {
    logStep("等待 heartbeat 进入终态");
    finalRun = await waitForRunTerminal(run.id, RUN_TIMEOUT_MS);
    logInfo(`最终 run 状态: ${finalRun.status}`);
    const finalRunError = extractRunErrorDetail(finalRun);
    if (finalRunError) {
      logInfo(`run error: ${finalRunError}`);
    }
    runLogExcerpt = await fetchRunLogExcerpt(run.id);
  }

  const [postRunIssue, postRunComments, postRunChildIssues] = await Promise.all([
    apiFetch(`/issues/${smokeIssue.id}`),
    apiFetch(`/issues/${smokeIssue.id}/comments`),
    listIssueChildren(company.id, smokeIssue.id),
  ]);
  const postRunCommentCount = Array.isArray(postRunComments) ? postRunComments.length : 0;
  const postRunAssignedChildCount = postRunChildIssues.filter((issue) => issue.assigneeAgentId).length;
  const finalRunError = finalRun ? extractRunErrorDetail(finalRun) : null;
  const toleratedTurnCap =
    Boolean(finalRun) &&
    finalRun.status === "failed" &&
    typeof finalRunError === "string" &&
    finalRunError.includes("Max turns") &&
    postRunCommentCount > 0 &&
    postRunAssignedChildCount >= 3;

  let descendantObservation = null;
  if (OBSERVE_DESCENDANTS && (finalRun?.status === "succeeded" || toleratedTurnCap)) {
    descendantObservation = await observeDescendantExecution({
      companyId: company.id,
      rootIssueId: smokeIssue.id,
      rootRunId: finalRun.id,
      agentNameById,
      timeoutMs: DESCENDANT_TIMEOUT_MS,
      settleMs: DESCENDANT_SETTLE_MS,
    });
  }

  logStep("收集运行后的公司与任务状态");
  const [latestIssue, issueComments, childIssues, dashboard] = await Promise.all([
    apiFetch(`/issues/${smokeIssue.id}`),
    apiFetch(`/issues/${smokeIssue.id}/comments`),
    listIssueChildren(company.id, smokeIssue.id),
    apiFetch(`/companies/${company.id}/dashboard`),
  ]);

  const warnings = [];
  if (adapterEnvironment?.status !== "pass") {
    warnings.push(`adapter 环境检查为 ${adapterEnvironment.status}`);
  }
  if (!run && !SKIP_RUN) {
    warnings.push("没有观察到 heartbeat run");
  }
  if (Array.isArray(issueComments) && issueComments.length === 0) {
    warnings.push("主任务暂无评论，说明协作痕迹还不明显");
  }
  if (childIssues.length === 0) {
    warnings.push("未观察到子任务拆分");
  }
  if (toleratedTurnCap) {
    warnings.push("heartbeat 在预期产物已经落库后触发了 Max turns，已按行为成功处理");
  }
  if (descendantObservation?.warnings?.length > 0) {
    warnings.push(...descendantObservation.warnings.map((warning) => `下游观察: ${warning}`));
  }

  const summary = {
    apiBase: API_BASE,
    company: {
      id: company.id,
      name: company.name,
      issuePrefix: company.issuePrefix,
      dashboardUrl: `${UI_BASE}/${company.issuePrefix}/dashboard`,
    },
    adapterEnvironment: {
      status: adapterEnvironment?.status ?? null,
    },
    agents: {
      total: createdAgents.length,
      pmId: agentIdsByRef.pm,
    },
    issue: {
      id: smokeIssue.id,
      identifier: smokeIssue.identifier ?? null,
      statusAfterRun: latestIssue.status,
      commentCount: Array.isArray(issueComments) ? issueComments.length : 0,
      childIssueCount: childIssues.length,
    },
    heartbeat: {
      wakeStrategy,
      runId: finalRun?.id ?? run?.id ?? null,
      status: finalRun?.status ?? null,
      normalizedStatus: finalRun?.status === "succeeded" || toleratedTurnCap ? "behavioral_success" : finalRun?.status ?? null,
      behavioralSuccess: finalRun?.status === "succeeded" || toleratedTurnCap,
      error: finalRunError,
    },
    descendantObservation,
    dashboard,
    warnings,
  };

  console.log("\n=== Smoke Test Summary ===");
  console.log(JSON.stringify(summary, null, 2));

  if (runLogExcerpt) {
    console.log("\n=== Heartbeat Log Excerpt ===");
    console.log(runLogExcerpt);
  }

  if (warnings.length > 0) {
    console.log("\n=== Warnings ===");
    for (const warning of warnings) {
      console.log(`- ${warning}`);
    }
  }

  if (!SKIP_RUN) {
    assert(run, "Expected at least one heartbeat run, but none was observed");
    assert(finalRun, "Expected a final heartbeat run result");
    assert(
      finalRun.status === "succeeded" || toleratedTurnCap,
      `Expected heartbeat to succeed or produce expected artifacts before hitting turn limits, but final status was ${finalRun.status}`,
    );
  }

  if (descendantObservation?.warnings?.length > 0) {
    for (const warning of descendantObservation.warnings) {
      logWarn(warning);
    }
  }
}

main().catch((error) => {
  console.error("\n❌ TradingAgents smoke test failed.");
  console.error(toErrorMessage(error));
  process.exitCode = 1;
});
