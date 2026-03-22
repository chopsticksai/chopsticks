import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  listGeminiSkills,
  syncGeminiSkills,
} from "@runeachai/adapter-gemini-local/server";

async function makeTempDir(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

describe("gemini local skill sync", () => {
  const runeachKey = "runeachai/runeach/runeach";
  const cleanupDirs = new Set<string>();

  afterEach(async () => {
    await Promise.all(Array.from(cleanupDirs).map((dir) => fs.rm(dir, { recursive: true, force: true })));
    cleanupDirs.clear();
  });

  it("reports configured RunEach skills and installs them into the Gemini skills home", async () => {
    const home = await makeTempDir("runeach-gemini-skill-sync-");
    cleanupDirs.add(home);

    const ctx = {
      agentId: "agent-1",
      companyId: "company-1",
      adapterType: "gemini_local",
      config: {
        env: {
          HOME: home,
        },
        runeachSkillSync: {
          desiredSkills: [runeachKey],
        },
      },
    } as const;

    const before = await listGeminiSkills(ctx);
    expect(before.mode).toBe("persistent");
    expect(before.desiredSkills).toContain(runeachKey);
    expect(before.entries.find((entry) => entry.key === runeachKey)?.required).toBe(true);
    expect(before.entries.find((entry) => entry.key === runeachKey)?.state).toBe("missing");

    const after = await syncGeminiSkills(ctx, [runeachKey]);
    expect(after.entries.find((entry) => entry.key === runeachKey)?.state).toBe("installed");
    expect((await fs.lstat(path.join(home, ".gemini", "skills", "runeach"))).isSymbolicLink()).toBe(true);
  });

  it("keeps required bundled RunEach skills installed even when the desired set is emptied", async () => {
    const home = await makeTempDir("runeach-gemini-skill-prune-");
    cleanupDirs.add(home);

    const configuredCtx = {
      agentId: "agent-2",
      companyId: "company-1",
      adapterType: "gemini_local",
      config: {
        env: {
          HOME: home,
        },
        runeachSkillSync: {
          desiredSkills: [runeachKey],
        },
      },
    } as const;

    await syncGeminiSkills(configuredCtx, [runeachKey]);

    const clearedCtx = {
      ...configuredCtx,
      config: {
        env: {
          HOME: home,
        },
        runeachSkillSync: {
          desiredSkills: [],
        },
      },
    } as const;

    const after = await syncGeminiSkills(clearedCtx, []);
    expect(after.desiredSkills).toContain(runeachKey);
    expect(after.entries.find((entry) => entry.key === runeachKey)?.state).toBe("installed");
    expect((await fs.lstat(path.join(home, ".gemini", "skills", "runeach"))).isSymbolicLink()).toBe(true);
  });
});
