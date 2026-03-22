import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  listCodexSkills,
  syncCodexSkills,
} from "@runeachai/adapter-codex-local/server";

async function makeTempDir(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

describe("codex local skill sync", () => {
  const runeachKey = "runeachai/runeach/runeach";
  const cleanupDirs = new Set<string>();

  afterEach(async () => {
    await Promise.all(Array.from(cleanupDirs).map((dir) => fs.rm(dir, { recursive: true, force: true })));
    cleanupDirs.clear();
  });

  it("reports configured RunEach skills for workspace injection on the next run", async () => {
    const codexHome = await makeTempDir("runeach-codex-skill-sync-");
    cleanupDirs.add(codexHome);

    const ctx = {
      agentId: "agent-1",
      companyId: "company-1",
      adapterType: "codex_local",
      config: {
        env: {
          CODEX_HOME: codexHome,
        },
        runeachSkillSync: {
          desiredSkills: [runeachKey],
        },
      },
    } as const;

    const before = await listCodexSkills(ctx);
    expect(before.mode).toBe("ephemeral");
    expect(before.desiredSkills).toContain(runeachKey);
    expect(before.entries.find((entry) => entry.key === runeachKey)?.required).toBe(true);
    expect(before.entries.find((entry) => entry.key === runeachKey)?.state).toBe("configured");
    expect(before.entries.find((entry) => entry.key === runeachKey)?.detail).toContain(".agents/skills");
  });

  it("does not persist RunEach skills into CODEX_HOME during sync", async () => {
    const codexHome = await makeTempDir("runeach-codex-skill-prune-");
    cleanupDirs.add(codexHome);

    const configuredCtx = {
      agentId: "agent-2",
      companyId: "company-1",
      adapterType: "codex_local",
      config: {
        env: {
          CODEX_HOME: codexHome,
        },
        runeachSkillSync: {
          desiredSkills: [runeachKey],
        },
      },
    } as const;

    const after = await syncCodexSkills(configuredCtx, [runeachKey]);
    expect(after.mode).toBe("ephemeral");
    expect(after.entries.find((entry) => entry.key === runeachKey)?.state).toBe("configured");
    await expect(fs.lstat(path.join(codexHome, "skills", "runeach"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("keeps required bundled RunEach skills configured even when the desired set is emptied", async () => {
    const codexHome = await makeTempDir("runeach-codex-skill-required-");
    cleanupDirs.add(codexHome);

    const configuredCtx = {
      agentId: "agent-2",
      companyId: "company-1",
      adapterType: "codex_local",
      config: {
        env: {
          CODEX_HOME: codexHome,
        },
        runeachSkillSync: {
          desiredSkills: [],
        },
      },
    } as const;

    const after = await syncCodexSkills(configuredCtx, []);
    expect(after.desiredSkills).toContain(runeachKey);
    expect(after.entries.find((entry) => entry.key === runeachKey)?.state).toBe("configured");
  });

  it("normalizes legacy flat RunEach skill refs before reporting configured state", async () => {
    const codexHome = await makeTempDir("runeach-codex-legacy-skill-sync-");
    cleanupDirs.add(codexHome);

    const snapshot = await listCodexSkills({
      agentId: "agent-3",
      companyId: "company-1",
      adapterType: "codex_local",
      config: {
        env: {
          CODEX_HOME: codexHome,
        },
        runeachSkillSync: {
          desiredSkills: ["runeach"],
        },
      },
    });

    expect(snapshot.warnings).toEqual([]);
    expect(snapshot.desiredSkills).toContain(runeachKey);
    expect(snapshot.desiredSkills).not.toContain("runeach");
    expect(snapshot.entries.find((entry) => entry.key === runeachKey)?.state).toBe("configured");
    expect(snapshot.entries.find((entry) => entry.key === "runeach")).toBeUndefined();
  });
});
