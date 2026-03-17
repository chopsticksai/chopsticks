import { describe, expect, it } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { testEnvironment } from "@chopsticks/adapter-qwen-local/server";

async function writeFakeQwenCommand(binDir: string, behavior: "success" | "auth"): Promise<string> {
  const basePath = path.join(binDir, "qwen");
  const script = behavior === "success"
    ? `
const fs = require("node:fs");
const outPath = process.env.CHOPSTICKS_TEST_ARGS_PATH;
if (outPath) {
  fs.writeFileSync(outPath, JSON.stringify({
    argv: process.argv.slice(2),
    qwenSandbox: process.env.QWEN_SANDBOX,
  }), "utf8");
}
console.log(JSON.stringify({
  type: "assistant",
  message: { content: [{ type: "output_text", text: "hello" }] },
}));
console.log(JSON.stringify({
  type: "result",
  subtype: "success",
  result: "hello",
}));
`
    : `
console.error("Authentication required. Run qwen and use /auth.");
process.exit(1);
`;
  if (process.platform === "win32") {
    const scriptPath = `${basePath}.js`;
    const commandPath = `${basePath}.cmd`;
    await fs.writeFile(scriptPath, script, "utf8");
    await fs.writeFile(
      commandPath,
      `@echo off\r\n"${process.execPath}" "${scriptPath}" %*\r\n`,
      "utf8",
    );
    return commandPath;
  }

  await fs.writeFile(basePath, `#!/usr/bin/env node\n${script}`, "utf8");
  await fs.chmod(basePath, 0o755);
  return basePath;
}

describe("qwen_local environment diagnostics", () => {
  it("creates a missing working directory when cwd is absolute", async () => {
    const cwd = path.join(
      os.tmpdir(),
      `chopsticks-qwen-local-cwd-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      "workspace",
    );

    await fs.rm(path.dirname(cwd), { recursive: true, force: true });

    const result = await testEnvironment({
      companyId: "company-1",
      adapterType: "qwen_local",
      config: {
        command: process.execPath,
        cwd,
      },
    });

    expect(result.checks.some((check) => check.code === "qwen_cwd_valid")).toBe(true);
    expect(result.checks.some((check) => check.level === "error")).toBe(false);
    const stats = await fs.stat(cwd);
    expect(stats.isDirectory()).toBe(true);
    await fs.rm(path.dirname(cwd), { recursive: true, force: true });
  });

  it("passes model, yolo flags, and explicit sandbox env to the hello probe", async () => {
    const root = path.join(
      os.tmpdir(),
      `chopsticks-qwen-local-probe-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    );
    const binDir = path.join(root, "bin");
    const cwd = path.join(root, "workspace");
    const argsCapturePath = path.join(root, "args.json");
    await fs.mkdir(binDir, { recursive: true });
    await writeFakeQwenCommand(binDir, "success");

    const result = await testEnvironment({
      companyId: "company-1",
      adapterType: "qwen_local",
      config: {
        command: "qwen",
        cwd,
        model: "qwen3-coder-plus",
        sandbox: false,
        env: {
          DASHSCOPE_API_KEY: "test-key",
          CHOPSTICKS_TEST_ARGS_PATH: argsCapturePath,
          PATH: `${binDir}${path.delimiter}${process.env.PATH ?? ""}`,
        },
      },
    });

    expect(result.status).not.toBe("fail");
    const capture = JSON.parse(await fs.readFile(argsCapturePath, "utf8")) as {
      argv: string[];
      qwenSandbox: string;
    };
    expect(capture.argv).toContain("--model");
    expect(capture.argv).toContain("qwen3-coder-plus");
    expect(capture.argv).toContain("--approval-mode");
    expect(capture.argv).toContain("yolo");
    expect(capture.qwenSandbox).toBe("false");
    await fs.rm(root, { recursive: true, force: true });
  });

  it("treats missing explicit auth as info and detects auth-not-ready probes", async () => {
    const root = path.join(
      os.tmpdir(),
      `chopsticks-qwen-local-auth-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    );
    const binDir = path.join(root, "bin");
    const cwd = path.join(root, "workspace");
    await fs.mkdir(binDir, { recursive: true });
    await writeFakeQwenCommand(binDir, "auth");

    const result = await testEnvironment({
      companyId: "company-1",
      adapterType: "qwen_local",
      config: {
        command: "qwen",
        cwd,
        env: {
          PATH: `${binDir}${path.delimiter}${process.env.PATH ?? ""}`,
        },
      },
    });

    expect(result.status).toBe("warn");
    expect(result.checks.some((check) => check.code === "qwen_auth_not_explicit" && check.level === "info")).toBe(true);
    expect(result.checks.some((check) => check.code === "qwen_hello_probe_auth_required" && check.level === "warn")).toBe(true);
    await fs.rm(root, { recursive: true, force: true });
  });
});
