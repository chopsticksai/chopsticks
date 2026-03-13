import { describe, expect, it } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execute } from "@swarmifyx/adapter-gemini-local/server";

async function writeFakeGeminiCommand(commandPath: string): Promise<void> {
  const script = `#!/usr/bin/env node
const fs = require("node:fs");

const capturePath = process.env.SWARMIFYX_TEST_CAPTURE_PATH;
const payload = {
  argv: process.argv.slice(2),
  swarmifyxEnvKeys: Object.keys(process.env)
    .filter((key) => key.startsWith("SWARMIFYX_"))
    .sort(),
};
if (capturePath) {
  fs.writeFileSync(capturePath, JSON.stringify(payload), "utf8");
}
console.log(JSON.stringify({
  type: "system",
  subtype: "init",
  session_id: "gemini-session-1",
  model: "gemini-2.5-pro",
}));
console.log(JSON.stringify({
  type: "assistant",
  message: { content: [{ type: "output_text", text: "hello" }] },
}));
console.log(JSON.stringify({
  type: "result",
  subtype: "success",
  session_id: "gemini-session-1",
  result: "ok",
}));
`;
  await fs.writeFile(commandPath, script, "utf8");
  await fs.chmod(commandPath, 0o755);
}

type CapturePayload = {
  argv: string[];
  swarmifyxEnvKeys: string[];
};

describe("gemini execute", () => {
  it("passes prompt as final argument and injects swarmifyx env vars", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "swarmifyx-gemini-execute-"));
    const workspace = path.join(root, "workspace");
    const commandPath = path.join(root, "gemini");
    const capturePath = path.join(root, "capture.json");
    await fs.mkdir(workspace, { recursive: true });
    await writeFakeGeminiCommand(commandPath);

    const previousHome = process.env.HOME;
    process.env.HOME = root;

    let invocationPrompt = "";
    try {
      const result = await execute({
        runId: "run-1",
        agent: {
          id: "agent-1",
          companyId: "company-1",
          name: "Gemini Coder",
          adapterType: "gemini_local",
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
          model: "gemini-2.5-pro",
          env: {
            SWARMIFYX_TEST_CAPTURE_PATH: capturePath,
          },
          promptTemplate: "Follow the swarmifyx heartbeat.",
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
      expect(capture.argv.at(-1)).toContain("Follow the swarmifyx heartbeat.");
      expect(capture.argv.at(-1)).toContain("Swarmifyx runtime note:");
      expect(capture.swarmifyxEnvKeys).toEqual(
        expect.arrayContaining([
          "SWARMIFYX_AGENT_ID",
          "SWARMIFYX_API_KEY",
          "SWARMIFYX_API_URL",
          "SWARMIFYX_COMPANY_ID",
          "SWARMIFYX_RUN_ID",
        ]),
      );
      expect(invocationPrompt).toContain("Swarmifyx runtime note:");
      expect(invocationPrompt).toContain("SWARMIFYX_API_URL");
      expect(invocationPrompt).toContain("Swarmifyx API access note:");
      expect(invocationPrompt).toContain("run_shell_command");
      expect(result.question).toBeNull();
    } finally {
      if (previousHome === undefined) {
        delete process.env.HOME;
      } else {
        process.env.HOME = previousHome;
      }
      await fs.rm(root, { recursive: true, force: true });
    }
  });

  it("always passes --approval-mode yolo", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "swarmifyx-gemini-yolo-"));
    const workspace = path.join(root, "workspace");
    const commandPath = path.join(root, "gemini");
    const capturePath = path.join(root, "capture.json");
    await fs.mkdir(workspace, { recursive: true });
    await writeFakeGeminiCommand(commandPath);

    const previousHome = process.env.HOME;
    process.env.HOME = root;

    try {
      await execute({
        runId: "run-yolo",
        agent: { id: "a1", companyId: "c1", name: "G", adapterType: "gemini_local", adapterConfig: {} },
        runtime: { sessionId: null, sessionParams: null, sessionDisplayId: null, taskKey: null },
        config: {
          command: commandPath,
          cwd: workspace,
          env: { SWARMIFYX_TEST_CAPTURE_PATH: capturePath },
        },
        context: {},
        authToken: "t",
        onLog: async () => { },
      });

      const capture = JSON.parse(await fs.readFile(capturePath, "utf8")) as CapturePayload;
      expect(capture.argv).toContain("--approval-mode");
      expect(capture.argv).toContain("yolo");
      expect(capture.argv).not.toContain("--policy");
      expect(capture.argv).not.toContain("--allow-all");
      expect(capture.argv).not.toContain("--allow-read");
    } finally {
      if (previousHome === undefined) {
        delete process.env.HOME;
      } else {
        process.env.HOME = previousHome;
      }
      await fs.rm(root, { recursive: true, force: true });
    }
  });
});
