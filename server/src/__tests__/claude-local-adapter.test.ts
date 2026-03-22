import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  isClaudeMaxTurnsResult,
  prepareClaudeInstructionsFile,
} from "@abacus-lab/adapter-claude-local/server";

describe("claude_local max-turn detection", () => {
  it("detects max-turn exhaustion by subtype", () => {
    expect(
      isClaudeMaxTurnsResult({
        subtype: "error_max_turns",
        result: "Reached max turns",
      }),
    ).toBe(true);
  });

  it("detects max-turn exhaustion by stop_reason", () => {
    expect(
      isClaudeMaxTurnsResult({
        stop_reason: "max_turns",
      }),
    ).toBe(true);
  });

  it("returns false for non-max-turn results", () => {
    expect(
      isClaudeMaxTurnsResult({
        subtype: "success",
        stop_reason: "end_turn",
      }),
    ).toBe(false);
  });
});

describe("claude_local instructions file handling", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(
      tempDirs.splice(0, tempDirs.length).map((dir) =>
        fs.rm(dir, { recursive: true, force: true }),
      ),
    );
  });

  it("logs an abacus warning and returns undefined when the instructions file is missing", async () => {
    const skillsDir = await fs.mkdtemp(path.join(os.tmpdir(), "abacus-claude-test-"));
    tempDirs.push(skillsDir);

    const logs: Array<{ stream: "stdout" | "stderr"; chunk: string }> = [];
    const result = await prepareClaudeInstructionsFile({
      instructionsFilePath: path.join(skillsDir, "missing", "AGENTS.md"),
      skillsDir,
      onLog: async (stream, chunk) => {
        logs.push({ stream, chunk });
      },
    });

    expect(result).toBeUndefined();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ stream: "stderr" });
    expect(logs[0]?.chunk).toContain("[abacus] Warning: could not read agent instructions file");
    expect(logs[0]?.chunk).toContain("AGENTS.md");
  });
});
