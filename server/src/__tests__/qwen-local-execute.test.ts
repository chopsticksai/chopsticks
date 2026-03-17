import { describe, expect, it } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execute } from "@chopsticks/adapter-qwen-local/server";

async function writeFakeQwenCommand(basePath: string): Promise<string> {
  const script = `
const fs = require("node:fs");

const capturePath = process.env.CHOPSTICKS_TEST_CAPTURE_PATH;
const payload = {
  argv: process.argv.slice(2),
  qwenSandbox: process.env.QWEN_SANDBOX,
  chopsticksEnvKeys: Object.keys(process.env)
    .filter((key) => key.startsWith("CHOPSTICKS_"))
    .sort(),
};
if (capturePath) {
  fs.writeFileSync(capturePath, JSON.stringify(payload), "utf8");
}
console.log(JSON.stringify({
  type: "system",
  subtype: "init",
  session_id: "qwen-session-1",
  model: "qwen3-coder-plus",
}));
console.log(JSON.stringify({
  type: "assistant",
  message: { content: [{ type: "output_text", text: "hello" }] },
}));
console.log(JSON.stringify({
  type: "result",
  subtype: "success",
  session_id: "qwen-session-1",
  result: "ok",
}));
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

type CapturePayload = {
  argv: string[];
  qwenSandbox: string | null;
  chopsticksEnvKeys: string[];
};

function setTempHome(root: string) {
  const previous = {
    HOME: process.env.HOME,
    USERPROFILE: process.env.USERPROFILE,
    HOMEDRIVE: process.env.HOMEDRIVE,
    HOMEPATH: process.env.HOMEPATH,
  };
  process.env.HOME = root;
  process.env.USERPROFILE = root;
  const parsed = path.parse(root);
  process.env.HOMEDRIVE = parsed.root.slice(0, 2) || previous.HOMEDRIVE;
  process.env.HOMEPATH = root.slice(parsed.root.length - (parsed.root.endsWith("\\") ? 1 : 0));
  return () => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
}

describe("qwen execute", () => {
  it("passes prompt as final argument and injects chopsticks env vars", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "chopsticks-qwen-execute-"));
    const workspace = path.join(root, "workspace");
    const commandPath = await writeFakeQwenCommand(path.join(root, "qwen"));
    const capturePath = path.join(root, "capture.json");
    await fs.mkdir(workspace, { recursive: true });
    const restoreHome = setTempHome(root);

    let invocationPrompt = "";
    try {
      const result = await execute({
        runId: "run-1",
        agent: {
          id: "agent-1",
          companyId: "company-1",
          name: "Qwen Coder",
          adapterType: "qwen_local",
          adapterConfig: {},
        },
        runtime: {
          sessionId: null,
          sessionParams: null,
          sessionDisplayId: null,
          taskKey: null,
        },
        config: {
          command: commandPath,
          cwd: workspace,
          model: "qwen3-coder-plus",
          env: {
            CHOPSTICKS_TEST_CAPTURE_PATH: capturePath,
          },
          promptTemplate: "Follow the chopsticks heartbeat.",
        },
        context: {},
        authToken: "run-jwt-token",
        onLog: async () => { },
        onMeta: async (meta) => {
          invocationPrompt = meta.prompt ?? "";
        },
      });

      expect(result.exitCode).toBe(0);
      expect(result.errorMessage).toBeNull();

      const capture = JSON.parse(await fs.readFile(capturePath, "utf8")) as CapturePayload;
      expect(capture.argv).toContain("--output-format");
      expect(capture.argv).toContain("stream-json");
      expect(capture.argv).toContain("--approval-mode");
      expect(capture.argv).toContain("yolo");
      expect(capture.argv).toContain("--sandbox");
      expect(capture.qwenSandbox).toBe("true");
      if (process.platform === "win32") {
        expect(invocationPrompt).toContain("Follow the chopsticks heartbeat.");
        expect(invocationPrompt).toContain("Chopsticks runtime note:");
      } else {
        expect(capture.argv.at(-1)).toContain("Follow the chopsticks heartbeat.");
        expect(capture.argv.at(-1)).toContain("Chopsticks runtime note:");
      }
      expect(capture.chopsticksEnvKeys).toEqual(
        expect.arrayContaining([
          "CHOPSTICKS_AGENT_ID",
          "CHOPSTICKS_API_KEY",
          "CHOPSTICKS_API_URL",
          "CHOPSTICKS_COMPANY_ID",
          "CHOPSTICKS_RUN_ID",
        ]),
      );
      expect(invocationPrompt).toContain("Chopsticks API access note:");
      expect(invocationPrompt).toContain("run_shell_command");
      expect(result.question).toBeNull();
    } finally {
      restoreHome();
      await fs.rm(root, { recursive: true, force: true });
    }
  });

  it("sets QWEN_SANDBOX=false when sandbox is bypassed", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "chopsticks-qwen-sandbox-"));
    const workspace = path.join(root, "workspace");
    const commandPath = await writeFakeQwenCommand(path.join(root, "qwen"));
    const capturePath = path.join(root, "capture.json");
    await fs.mkdir(workspace, { recursive: true });
    const restoreHome = setTempHome(root);

    try {
      await execute({
        runId: "run-sandbox",
        agent: { id: "a1", companyId: "c1", name: "Q", adapterType: "qwen_local", adapterConfig: {} },
        runtime: { sessionId: null, sessionParams: null, sessionDisplayId: null, taskKey: null },
        config: {
          command: commandPath,
          cwd: workspace,
          sandbox: false,
          env: { CHOPSTICKS_TEST_CAPTURE_PATH: capturePath },
        },
        context: {},
        authToken: "t",
        onLog: async () => { },
      });

      const capture = JSON.parse(await fs.readFile(capturePath, "utf8")) as CapturePayload;
      expect(capture.qwenSandbox).toBe("false");
      expect(capture.argv).not.toContain("--sandbox");
      expect(capture.argv).toContain("--approval-mode");
      expect(capture.argv).toContain("yolo");
    } finally {
      restoreHome();
      await fs.rm(root, { recursive: true, force: true });
    }
  });
});
