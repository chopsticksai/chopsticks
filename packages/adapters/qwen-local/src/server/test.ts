import path from "node:path";
import type {
  AdapterEnvironmentCheck,
  AdapterEnvironmentTestContext,
  AdapterEnvironmentTestResult,
} from "@chopsticks/adapter-utils";
import {
  asBoolean,
  asString,
  asStringArray,
  ensureAbsoluteDirectory,
  ensureCommandResolvable,
  ensurePathInEnv,
  parseObject,
  runChildProcess,
} from "@chopsticks/adapter-utils/server-utils";
import { DEFAULT_QWEN_LOCAL_MODEL } from "../index.js";
import { detectQwenAuthRequired, parseQwenJsonl } from "./parse.js";
import { firstNonEmptyLine } from "./utils.js";

function summarizeStatus(checks: AdapterEnvironmentCheck[]): AdapterEnvironmentTestResult["status"] {
  if (checks.some((check) => check.level === "error")) return "fail";
  if (checks.some((check) => check.level === "warn")) return "warn";
  return "pass";
}

function isNonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function commandLooksLike(command: string, expected: string): boolean {
  const base = path.basename(command).toLowerCase();
  return base === expected || base === `${expected}.cmd` || base === `${expected}.exe`;
}

function summarizeProbeDetail(stdout: string, stderr: string, parsedError: string | null): string | null {
  const raw = parsedError?.trim() || firstNonEmptyLine(stderr) || firstNonEmptyLine(stdout);
  if (!raw) return null;
  const clean = raw.replace(/\s+/g, " ").trim();
  const max = 240;
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

export async function testEnvironment(
  ctx: AdapterEnvironmentTestContext,
): Promise<AdapterEnvironmentTestResult> {
  const checks: AdapterEnvironmentCheck[] = [];
  const config = parseObject(ctx.config);
  const command = asString(config.command, "qwen");
  const cwd = asString(config.cwd, process.cwd());

  try {
    await ensureAbsoluteDirectory(cwd, { createIfMissing: true });
    checks.push({
      code: "qwen_cwd_valid",
      level: "info",
      message: `Working directory is valid: ${cwd}`,
    });
  } catch (err) {
    checks.push({
      code: "qwen_cwd_invalid",
      level: "error",
      message: err instanceof Error ? err.message : "Invalid working directory",
      detail: cwd,
    });
  }

  const envConfig = parseObject(config.env);
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(envConfig)) {
    if (typeof value === "string") env[key] = value;
  }
  const runtimeEnv = ensurePathInEnv({ ...process.env, ...env });
  try {
    await ensureCommandResolvable(command, cwd, runtimeEnv);
    checks.push({
      code: "qwen_command_resolvable",
      level: "info",
      message: `Command is executable: ${command}`,
    });
  } catch (err) {
    checks.push({
      code: "qwen_command_unresolvable",
      level: "error",
      message: err instanceof Error ? err.message : "Command is not executable",
      detail: command,
    });
  }

  const configDashscopeApiKey = env.DASHSCOPE_API_KEY;
  const hostDashscopeApiKey = process.env.DASHSCOPE_API_KEY;
  const configBailianApiKey = env.BAILIAN_CODING_PLAN_API_KEY;
  const hostBailianApiKey = process.env.BAILIAN_CODING_PLAN_API_KEY;
  const configOpenAiApiKey = env.OPENAI_API_KEY;
  const hostOpenAiApiKey = process.env.OPENAI_API_KEY;
  const authType = asString(config.authType, "").trim();
  if (
    isNonEmpty(configDashscopeApiKey) ||
    isNonEmpty(hostDashscopeApiKey) ||
    isNonEmpty(configBailianApiKey) ||
    isNonEmpty(hostBailianApiKey) ||
    isNonEmpty(configOpenAiApiKey) ||
    isNonEmpty(hostOpenAiApiKey) ||
    authType.length > 0
  ) {
    const source = authType
      ? `authType=${authType}`
      : isNonEmpty(configDashscopeApiKey) || isNonEmpty(configBailianApiKey) || isNonEmpty(configOpenAiApiKey)
        ? "adapter config env"
        : "server environment";
    checks.push({
      code: "qwen_auth_configured",
      level: "info",
      message: "Qwen authentication appears to be configured.",
      detail: `Detected in ${source}.`,
    });
  } else {
    checks.push({
      code: "qwen_auth_not_explicit",
      level: "info",
      message: "No explicit API key detected. Qwen Code may still authenticate via interactive OAuth or ~/.qwen/settings.json.",
      hint: "If the hello probe fails with an auth error, run `qwen` and use `/auth`, or configure ~/.qwen/settings.json / provider API keys.",
    });
  }

  const canRunProbe =
    checks.every((check) => check.code !== "qwen_cwd_invalid" && check.code !== "qwen_command_unresolvable");
  if (canRunProbe) {
    if (!commandLooksLike(command, "qwen")) {
      checks.push({
        code: "qwen_hello_probe_skipped_custom_command",
        level: "info",
        message: "Skipped hello probe because command is not `qwen`.",
        detail: command,
        hint: "Use the `qwen` CLI command to run the automatic installation and auth probe.",
      });
    } else {
      const model = asString(config.model, DEFAULT_QWEN_LOCAL_MODEL).trim();
      const sandbox = asBoolean(config.sandbox, true);
      const extraArgs = (() => {
        const fromExtraArgs = asStringArray(config.extraArgs);
        if (fromExtraArgs.length > 0) return fromExtraArgs;
        return asStringArray(config.args);
      })();

      const args = [...extraArgs, "--output-format", "stream-json"];
      if (model && model !== DEFAULT_QWEN_LOCAL_MODEL) args.push("--model", model);
      args.push("--approval-mode", "yolo");
      if (sandbox) args.push("--sandbox");
      args.push("Respond with hello.");

      const probe = await runChildProcess(
        `qwen-envtest-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        command,
        args,
        {
          cwd,
          env: {
            ...env,
            QWEN_SANDBOX: sandbox ? "true" : "false",
          },
          timeoutSec: 45,
          graceSec: 5,
          onLog: async () => { },
        },
      );
      const parsed = parseQwenJsonl(probe.stdout);
      const detail = summarizeProbeDetail(probe.stdout, probe.stderr, parsed.errorMessage);
      const authMeta = detectQwenAuthRequired({
        parsed: parsed.resultEvent,
        stdout: probe.stdout,
        stderr: probe.stderr,
      });

      if (probe.timedOut) {
        checks.push({
          code: "qwen_hello_probe_timed_out",
          level: "warn",
          message: "Qwen hello probe timed out.",
          hint: "Retry the probe. If this persists, verify Qwen can run `Respond with hello.` from this directory manually.",
        });
      } else if ((probe.exitCode ?? 1) === 0) {
        const summary = parsed.summary.trim();
        const hasHello = /\bhello\b/i.test(summary);
        checks.push({
          code: hasHello ? "qwen_hello_probe_passed" : "qwen_hello_probe_unexpected_output",
          level: hasHello ? "info" : "warn",
          message: hasHello
            ? "Qwen hello probe succeeded."
            : "Qwen probe ran but did not return `hello` as expected.",
          ...(summary ? { detail: summary.replace(/\s+/g, " ").trim().slice(0, 240) } : {}),
          ...(hasHello
            ? {}
            : {
              hint: "Try `qwen --output-format stream-json --approval-mode yolo \"Respond with hello.\"` manually to inspect full output.",
            }),
        });
      } else if (authMeta.requiresAuth) {
        checks.push({
          code: "qwen_hello_probe_auth_required",
          level: "warn",
          message: "Qwen CLI is installed, but authentication is not ready.",
          ...(detail ? { detail } : {}),
          hint: "Run `qwen`, use `/auth`, or configure ~/.qwen/settings.json / provider API keys, then retry the probe.",
        });
      } else {
        checks.push({
          code: "qwen_hello_probe_failed",
          level: "error",
          message: "Qwen hello probe failed.",
          ...(detail ? { detail } : {}),
          hint: "Run `qwen --output-format stream-json --approval-mode yolo \"Respond with hello.\"` manually in this working directory to debug.",
        });
      }
    }
  }

  return {
    adapterType: ctx.adapterType,
    status: summarizeStatus(checks),
    checks,
    testedAt: new Date().toISOString(),
  };
}
