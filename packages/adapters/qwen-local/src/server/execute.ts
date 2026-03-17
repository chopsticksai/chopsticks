import fs from "node:fs/promises";
import type { Dirent } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inferOpenAiCompatibleBiller, type AdapterExecutionContext, type AdapterExecutionResult } from "@chopsticks/adapter-utils";
import {
  asBoolean,
  asNumber,
  asString,
  asStringArray,
  buildChopsticksEnv,
  ensureAbsoluteDirectory,
  ensureCommandResolvable,
  ensurePathInEnv,
  joinPromptSections,
  parseObject,
  redactEnvForLogs,
  renderTemplate,
  runChildProcess,
} from "@chopsticks/adapter-utils/server-utils";
import { DEFAULT_QWEN_LOCAL_MODEL } from "../index.js";
import {
  describeQwenFailure,
  detectQwenAuthRequired,
  isQwenTurnLimitResult,
  isQwenUnknownSessionError,
  parseQwenJsonl,
} from "./parse.js";
import { firstNonEmptyLine } from "./utils.js";

const __moduleDir = path.dirname(fileURLToPath(import.meta.url));
const CHOPSTICKS_SKILLS_CANDIDATES = [
  path.resolve(__moduleDir, "../../skills"),
  path.resolve(__moduleDir, "../../../../../skills"),
];

function hasNonEmptyEnvValue(env: Record<string, string>, key: string): boolean {
  const raw = env[key];
  return typeof raw === "string" && raw.trim().length > 0;
}

function resolveProviderFromModel(model: string): string | null {
  const trimmed = model.trim().toLowerCase();
  if (!trimmed || trimmed === DEFAULT_QWEN_LOCAL_MODEL) return null;
  const slash = trimmed.indexOf("/");
  if (slash > 0) return trimmed.slice(0, slash);
  if (trimmed.includes("claude") || trimmed.includes("sonnet")) return "anthropic";
  if (trimmed.includes("gemini")) return "google";
  if (trimmed.startsWith("gpt") || trimmed.startsWith("o")) return "openai";
  if (trimmed.includes("qwen")) return "qwen";
  return null;
}

function resolveQwenProviderAndBiller(input: {
  authType: string | null;
  env: Record<string, string>;
  model: string;
}): { provider: string; biller: string; billingType: "api" | "subscription" } {
  const { authType, env, model } = input;
  const normalizedAuthType = authType?.trim().toLowerCase() ?? "";
  const openAiCompatibleBiller = inferOpenAiCompatibleBiller(env, "openai");
  const modelProvider = resolveProviderFromModel(model);

  if (normalizedAuthType === "anthropic" || hasNonEmptyEnvValue(env, "ANTHROPIC_API_KEY")) {
    return { provider: "anthropic", biller: "anthropic", billingType: "api" };
  }

  if (
    normalizedAuthType === "gemini" ||
    normalizedAuthType === "vertex-ai" ||
    hasNonEmptyEnvValue(env, "GEMINI_API_KEY") ||
    hasNonEmptyEnvValue(env, "GOOGLE_API_KEY") ||
    env.GOOGLE_GENAI_USE_GCA === "true"
  ) {
    return { provider: "google", biller: "google", billingType: "api" };
  }

  if (normalizedAuthType === "openai" || hasNonEmptyEnvValue(env, "OPENAI_API_KEY")) {
    const provider = openAiCompatibleBiller ?? "openai";
    return { provider, biller: provider, billingType: "api" };
  }

  if (
    normalizedAuthType === "qwen-oauth" ||
    hasNonEmptyEnvValue(env, "DASHSCOPE_API_KEY") ||
    hasNonEmptyEnvValue(env, "BAILIAN_CODING_PLAN_API_KEY")
  ) {
    return {
      provider: "qwen",
      biller: "qwen",
      billingType:
        normalizedAuthType === "qwen-oauth" &&
          !hasNonEmptyEnvValue(env, "DASHSCOPE_API_KEY") &&
          !hasNonEmptyEnvValue(env, "BAILIAN_CODING_PLAN_API_KEY")
          ? "subscription"
          : "api",
    };
  }

  if (openAiCompatibleBiller) {
    return { provider: openAiCompatibleBiller, biller: openAiCompatibleBiller, billingType: "api" };
  }

  if (modelProvider === "anthropic") {
    return { provider: "anthropic", biller: "anthropic", billingType: "api" };
  }
  if (modelProvider === "google") {
    return { provider: "google", biller: "google", billingType: "api" };
  }
  if (modelProvider === "openai" || modelProvider === "openrouter") {
    return { provider: modelProvider, biller: modelProvider, billingType: "api" };
  }

  return { provider: "qwen", biller: "qwen", billingType: "subscription" };
}

function renderChopsticksEnvNote(env: Record<string, string>): string {
  const chopsticksKeys = Object.keys(env)
    .filter((key) => key.startsWith("CHOPSTICKS_"))
    .sort();
  if (chopsticksKeys.length === 0) return "";
  return [
    "Chopsticks runtime note:",
    `The following CHOPSTICKS_* environment variables are available in this run: ${chopsticksKeys.join(", ")}`,
    "Do not assume these variables are missing without checking your shell environment.",
  ].join("\n");
}

function renderApiAccessNote(env: Record<string, string>): string {
  if (!hasNonEmptyEnvValue(env, "CHOPSTICKS_API_URL") || !hasNonEmptyEnvValue(env, "CHOPSTICKS_API_KEY")) return "";
  return [
    "Chopsticks API access note:",
    "Use run_shell_command with curl to make Chopsticks API requests.",
    "GET example:",
    `  run_shell_command({ command: "curl -s -H \\"Authorization: Bearer $CHOPSTICKS_API_KEY\\" \\"$CHOPSTICKS_API_URL/api/agents/me\\"" })`,
    "POST/PATCH example:",
    `  run_shell_command({ command: "curl -s -X POST -H \\"Authorization: Bearer $CHOPSTICKS_API_KEY\\" -H 'Content-Type: application/json' -H \\"X-Chopsticks-Run-Id: $CHOPSTICKS_RUN_ID\\" -d '{...}' \\"$CHOPSTICKS_API_URL/api/issues/{id}/checkout\\"" })`,
  ].join("\n");
}

async function resolveChopsticksSkillsDir(): Promise<string | null> {
  for (const candidate of CHOPSTICKS_SKILLS_CANDIDATES) {
    const isDir = await fs.stat(candidate).then((stats) => stats.isDirectory()).catch(() => false);
    if (isDir) return candidate;
  }
  return null;
}

function qwenSkillsHome(): string {
  return path.join(os.homedir(), ".qwen", "skills");
}

type EnsureQwenSkillsInjectedOptions = {
  skillsDir?: string | null;
  skillsHome?: string;
  linkSkill?: (source: string, target: string) => Promise<void>;
};

export async function ensureQwenSkillsInjected(
  onLog: AdapterExecutionContext["onLog"],
  options: EnsureQwenSkillsInjectedOptions = {},
) {
  const skillsDir = options.skillsDir ?? await resolveChopsticksSkillsDir();
  if (!skillsDir) return;

  const skillsHome = options.skillsHome ?? qwenSkillsHome();
  try {
    await fs.mkdir(skillsHome, { recursive: true });
  } catch (err) {
    await onLog(
      "stderr",
      `[chopsticks] Failed to prepare Qwen skills directory ${skillsHome}: ${err instanceof Error ? err.message : String(err)}\n`,
    );
    return;
  }

  let entries: Dirent[];
  try {
    entries = await fs.readdir(skillsDir, { withFileTypes: true });
  } catch (err) {
    await onLog(
      "stderr",
      `[chopsticks] Failed to read Chopsticks skills from ${skillsDir}: ${err instanceof Error ? err.message : String(err)}\n`,
    );
    return;
  }

  const linkSkill = options.linkSkill ?? ((source: string, target: string) => fs.symlink(source, target));
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const source = path.join(skillsDir, entry.name);
    const target = path.join(skillsHome, entry.name);
    const existing = await fs.lstat(target).catch(() => null);
    if (existing) continue;

    try {
      await linkSkill(source, target);
      await onLog("stderr", `[chopsticks] Injected Qwen skill "${entry.name}" into ${skillsHome}\n`);
    } catch (err) {
      await onLog(
        "stderr",
        `[chopsticks] Failed to inject Qwen skill "${entry.name}" into ${skillsHome}: ${err instanceof Error ? err.message : String(err)}\n`,
      );
    }
  }
}

export async function execute(ctx: AdapterExecutionContext): Promise<AdapterExecutionResult> {
  const { runId, agent, runtime, config, context, onLog, onMeta, authToken } = ctx;

  const promptTemplate = asString(
    config.promptTemplate,
    "You are agent {{agent.id}} ({{agent.name}}). Continue your Chopsticks work.",
  );
  const command = asString(config.command, "qwen");
  const model = asString(config.model, DEFAULT_QWEN_LOCAL_MODEL).trim();
  const sandbox = asBoolean(config.sandbox, true);
  const authType = asString(config.authType, "").trim() || null;

  const workspaceContext = parseObject(context.chopsticksWorkspace);
  const workspaceCwd = asString(workspaceContext.cwd, "");
  const workspaceSource = asString(workspaceContext.source, "");
  const workspaceId = asString(workspaceContext.workspaceId, "");
  const workspaceRepoUrl = asString(workspaceContext.repoUrl, "");
  const workspaceRepoRef = asString(workspaceContext.repoRef, "");
  const agentHome = asString(workspaceContext.agentHome, "");
  const workspaceHints = Array.isArray(context.chopsticksWorkspaces)
    ? context.chopsticksWorkspaces.filter(
      (value): value is Record<string, unknown> => typeof value === "object" && value !== null,
    )
    : [];
  const configuredCwd = asString(config.cwd, "");
  const useConfiguredInsteadOfAgentHome = workspaceSource === "agent_home" && configuredCwd.length > 0;
  const effectiveWorkspaceCwd = useConfiguredInsteadOfAgentHome ? "" : workspaceCwd;
  const cwd = effectiveWorkspaceCwd || configuredCwd || process.cwd();
  await ensureAbsoluteDirectory(cwd, { createIfMissing: true });
  await ensureQwenSkillsInjected(onLog);

  const envConfig = parseObject(config.env);
  const hasExplicitApiKey =
    typeof envConfig.CHOPSTICKS_API_KEY === "string" && envConfig.CHOPSTICKS_API_KEY.trim().length > 0;
  const env: Record<string, string> = { ...buildChopsticksEnv(agent) };
  env.CHOPSTICKS_RUN_ID = runId;
  const wakeTaskId =
    (typeof context.taskId === "string" && context.taskId.trim().length > 0 && context.taskId.trim()) ||
    (typeof context.issueId === "string" && context.issueId.trim().length > 0 && context.issueId.trim()) ||
    null;
  const wakeReason =
    typeof context.wakeReason === "string" && context.wakeReason.trim().length > 0
      ? context.wakeReason.trim()
      : null;
  const wakeCommentId =
    (typeof context.wakeCommentId === "string" && context.wakeCommentId.trim().length > 0 && context.wakeCommentId.trim()) ||
    (typeof context.commentId === "string" && context.commentId.trim().length > 0 && context.commentId.trim()) ||
    null;
  const approvalId =
    typeof context.approvalId === "string" && context.approvalId.trim().length > 0
      ? context.approvalId.trim()
      : null;
  const approvalStatus =
    typeof context.approvalStatus === "string" && context.approvalStatus.trim().length > 0
      ? context.approvalStatus.trim()
      : null;
  const linkedIssueIds = Array.isArray(context.issueIds)
    ? context.issueIds.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    : [];
  if (wakeTaskId) env.CHOPSTICKS_TASK_ID = wakeTaskId;
  if (wakeReason) env.CHOPSTICKS_WAKE_REASON = wakeReason;
  if (wakeCommentId) env.CHOPSTICKS_WAKE_COMMENT_ID = wakeCommentId;
  if (approvalId) env.CHOPSTICKS_APPROVAL_ID = approvalId;
  if (approvalStatus) env.CHOPSTICKS_APPROVAL_STATUS = approvalStatus;
  if (linkedIssueIds.length > 0) env.CHOPSTICKS_LINKED_ISSUE_IDS = linkedIssueIds.join(",");
  if (effectiveWorkspaceCwd) env.CHOPSTICKS_WORKSPACE_CWD = effectiveWorkspaceCwd;
  if (workspaceSource) env.CHOPSTICKS_WORKSPACE_SOURCE = workspaceSource;
  if (workspaceId) env.CHOPSTICKS_WORKSPACE_ID = workspaceId;
  if (workspaceRepoUrl) env.CHOPSTICKS_WORKSPACE_REPO_URL = workspaceRepoUrl;
  if (workspaceRepoRef) env.CHOPSTICKS_WORKSPACE_REPO_REF = workspaceRepoRef;
  if (agentHome) env.AGENT_HOME = agentHome;
  if (workspaceHints.length > 0) env.CHOPSTICKS_WORKSPACES_JSON = JSON.stringify(workspaceHints);

  for (const [key, value] of Object.entries(envConfig)) {
    if (typeof value === "string") env[key] = value;
  }
  if (!hasExplicitApiKey && authToken) {
    env.CHOPSTICKS_API_KEY = authToken;
  }
  env.QWEN_SANDBOX = sandbox ? "true" : "false";

  const effectiveEnv = Object.fromEntries(
    Object.entries({ ...process.env, ...env }).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
  const runtimeEnv = ensurePathInEnv(effectiveEnv);
  await ensureCommandResolvable(command, cwd, runtimeEnv);

  const providerMeta = resolveQwenProviderAndBiller({
    authType,
    env: runtimeEnv as Record<string, string>,
    model,
  });

  const timeoutSec = asNumber(config.timeoutSec, 0);
  const graceSec = asNumber(config.graceSec, 15);
  const extraArgs = (() => {
    const fromExtraArgs = asStringArray(config.extraArgs);
    if (fromExtraArgs.length > 0) return fromExtraArgs;
    return asStringArray(config.args);
  })();

  const runtimeSessionParams = parseObject(runtime.sessionParams);
  const runtimeSessionId = asString(runtimeSessionParams.sessionId, runtime.sessionId ?? "");
  const runtimeSessionCwd = asString(runtimeSessionParams.cwd, "");
  const canResumeSession =
    runtimeSessionId.length > 0 &&
    (runtimeSessionCwd.length === 0 || path.resolve(runtimeSessionCwd) === path.resolve(cwd));
  const sessionId = canResumeSession ? runtimeSessionId : null;
  if (runtimeSessionId && !canResumeSession) {
    await onLog(
      "stderr",
      `[chopsticks] Qwen session "${runtimeSessionId}" was saved for cwd "${runtimeSessionCwd}" and will not be resumed in "${cwd}".\n`,
    );
  }

  const instructionsFilePath = asString(config.instructionsFilePath, "").trim();
  const instructionsDir = instructionsFilePath ? `${path.dirname(instructionsFilePath)}/` : "";
  let instructionsPrefix = "";
  if (instructionsFilePath) {
    try {
      const instructionsContents = await fs.readFile(instructionsFilePath, "utf8");
      instructionsPrefix =
        `${instructionsContents}\n\n` +
        `The above agent instructions were loaded from ${instructionsFilePath}. ` +
        `Resolve any relative file references from ${instructionsDir}.`;
      await onLog("stderr", `[chopsticks] Loaded agent instructions file: ${instructionsFilePath}\n`);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      await onLog(
        "stderr",
        `[chopsticks] Warning: could not read agent instructions file "${instructionsFilePath}": ${reason}\n`,
      );
    }
  }

  const commandNotes = (() => {
    const notes: string[] = [
      "Prompt is passed to Qwen as the final positional argument.",
      "Added --output-format stream-json for machine-readable events.",
      "Added --approval-mode yolo for unattended execution.",
      `Set QWEN_SANDBOX=${sandbox ? "true" : "false"} to avoid inheriting the host default.`,
    ];
    if (sandbox) notes.push("Added --sandbox because sandbox mode is enabled.");
    if (!instructionsFilePath) return notes;
    if (instructionsPrefix.length > 0) {
      notes.push(
        `Loaded agent instructions from ${instructionsFilePath}`,
        `Prepended instructions + path directive to prompt (relative references from ${instructionsDir}).`,
      );
      return notes;
    }
    notes.push(
      `Configured instructionsFilePath ${instructionsFilePath}, but file could not be read; continuing without injected instructions.`,
    );
    return notes;
  })();

  const renderedPrompt = renderTemplate(promptTemplate, {
    agentId: agent.id,
    companyId: agent.companyId,
    runId,
    company: { id: agent.companyId },
    agent,
    run: { id: runId, source: "on_demand" },
    context,
  });
  const prompt = joinPromptSections([
    instructionsPrefix,
    renderChopsticksEnvNote(env),
    renderApiAccessNote(env),
    renderedPrompt,
  ]);

  const buildArgs = (resumeSessionId: string | null) => {
    const args = [...extraArgs, "--output-format", "stream-json"];
    if (resumeSessionId) args.push("--resume", resumeSessionId);
    if (model && model !== DEFAULT_QWEN_LOCAL_MODEL) args.push("--model", model);
    args.push("--approval-mode", "yolo");
    if (sandbox) args.push("--sandbox");
    args.push(prompt);
    return args;
  };

  const runAttempt = async (resumeSessionId: string | null) => {
    const args = buildArgs(resumeSessionId);
    if (onMeta) {
      await onMeta({
        adapterType: "qwen_local",
        command,
        cwd,
        commandNotes,
        commandArgs: args.map((value, index) => (
          index === args.length - 1 ? `<prompt ${prompt.length} chars>` : value
        )),
        env: redactEnvForLogs(env),
        prompt,
        context,
      });
    }

    let stdoutLineBuffer = "";
    const flushStdoutChunk = async (chunk: string, finalize = false) => {
      const combined = `${stdoutLineBuffer}${chunk}`;
      const lines = combined.split(/\r?\n/);
      stdoutLineBuffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        await onLog("stdout", `${line}\n`);
      }

      if (finalize) {
        const trailing = stdoutLineBuffer.trim();
        stdoutLineBuffer = "";
        if (trailing) {
          await onLog("stdout", `${trailing}\n`);
        }
      }
    };

    const proc = await runChildProcess(runId, command, args, {
      cwd,
      env,
      timeoutSec,
      graceSec,
      onLog: async (stream, chunk) => {
        if (stream !== "stdout") {
          await onLog(stream, chunk);
          return;
        }
        await flushStdoutChunk(chunk);
      },
    });
    await flushStdoutChunk("", true);

    return {
      proc,
      parsed: parseQwenJsonl(proc.stdout),
    };
  };

  const toResult = (
    attempt: {
      proc: {
        exitCode: number | null;
        signal: string | null;
        timedOut: boolean;
        stdout: string;
        stderr: string;
      };
      parsed: ReturnType<typeof parseQwenJsonl>;
    },
    clearSessionOnMissingSession = false,
    isRetry = false,
  ): AdapterExecutionResult => {
    const authMeta = detectQwenAuthRequired({
      parsed: attempt.parsed.resultEvent,
      stdout: attempt.proc.stdout,
      stderr: attempt.proc.stderr,
    });

    if (attempt.proc.timedOut) {
      return {
        exitCode: attempt.proc.exitCode,
        signal: attempt.proc.signal,
        timedOut: true,
        errorMessage: `Timed out after ${timeoutSec}s`,
        errorCode: authMeta.requiresAuth ? "qwen_auth_required" : null,
        clearSession: clearSessionOnMissingSession,
      };
    }

    const clearSessionForTurnLimit = isQwenTurnLimitResult(attempt.parsed.resultEvent, attempt.proc.exitCode);
    const canFallbackToRuntimeSession = !isRetry;
    const resolvedSessionId = attempt.parsed.sessionId
      ?? (canFallbackToRuntimeSession ? (runtimeSessionId ?? runtime.sessionId ?? null) : null);
    const resolvedSessionParams = resolvedSessionId
      ? ({
        sessionId: resolvedSessionId,
        cwd,
        ...(workspaceId ? { workspaceId } : {}),
        ...(workspaceRepoUrl ? { repoUrl: workspaceRepoUrl } : {}),
        ...(workspaceRepoRef ? { repoRef: workspaceRepoRef } : {}),
      } as Record<string, unknown>)
      : null;
    const parsedError = typeof attempt.parsed.errorMessage === "string" ? attempt.parsed.errorMessage.trim() : "";
    const stderrLine = firstNonEmptyLine(attempt.proc.stderr);
    const structuredFailure = attempt.parsed.resultEvent
      ? describeQwenFailure(attempt.parsed.resultEvent)
      : null;
    const fallbackErrorMessage =
      parsedError ||
      structuredFailure ||
      stderrLine ||
      `Qwen exited with code ${attempt.proc.exitCode ?? -1}`;

    return {
      exitCode: attempt.proc.exitCode,
      signal: attempt.proc.signal,
      timedOut: false,
      errorMessage: (attempt.proc.exitCode ?? 0) === 0 ? null : fallbackErrorMessage,
      errorCode: (attempt.proc.exitCode ?? 0) !== 0 && authMeta.requiresAuth ? "qwen_auth_required" : null,
      usage: attempt.parsed.usage,
      sessionId: resolvedSessionId,
      sessionParams: resolvedSessionParams,
      sessionDisplayId: resolvedSessionId,
      provider: providerMeta.provider,
      biller: providerMeta.biller,
      model,
      billingType: providerMeta.billingType,
      costUsd: attempt.parsed.costUsd,
      resultJson: attempt.parsed.resultEvent ?? {
        stdout: attempt.proc.stdout,
        stderr: attempt.proc.stderr,
      },
      summary: attempt.parsed.summary,
      question: attempt.parsed.question,
      clearSession: clearSessionOnMissingSession || clearSessionForTurnLimit,
    };
  };

  const initial = await runAttempt(sessionId);
  if (
    sessionId &&
    !initial.proc.timedOut &&
    (initial.proc.exitCode ?? 0) !== 0 &&
    isQwenUnknownSessionError(initial.proc.stdout, initial.proc.stderr)
  ) {
    await onLog(
      "stderr",
      `[chopsticks] Qwen resume session "${sessionId}" is unavailable; retrying with a fresh session.\n`,
    );
    const retry = await runAttempt(null);
    return toResult(retry, true, true);
  }

  return toResult(initial);
}
