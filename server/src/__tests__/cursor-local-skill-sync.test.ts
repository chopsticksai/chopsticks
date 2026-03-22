import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  listCursorSkills,
  syncCursorSkills,
} from "@runeachai/adapter-cursor-local/server";

async function makeTempDir(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

async function createSkillDir(root: string, name: string) {
  const skillDir = path.join(root, name);
  await fs.mkdir(skillDir, { recursive: true });
  await fs.writeFile(path.join(skillDir, "SKILL.md"), `---\nname: ${name}\n---\n`, "utf8");
  return skillDir;
}

describe("cursor local skill sync", () => {
  const runeachKey = "runeachai/runeach/runeach";
  const cleanupDirs = new Set<string>();

  afterEach(async () => {
    await Promise.all(Array.from(cleanupDirs).map((dir) => fs.rm(dir, { recursive: true, force: true })));
    cleanupDirs.clear();
  });

  it("reports configured RunEach skills and installs them into the Cursor skills home", async () => {
    const home = await makeTempDir("runeach-cursor-skill-sync-");
    cleanupDirs.add(home);

    const ctx = {
      agentId: "agent-1",
      companyId: "company-1",
      adapterType: "cursor",
      config: {
        env: {
          HOME: home,
        },
        runeachSkillSync: {
          desiredSkills: [runeachKey],
        },
      },
    } as const;

    const before = await listCursorSkills(ctx);
    expect(before.mode).toBe("persistent");
    expect(before.desiredSkills).toContain(runeachKey);
    expect(before.entries.find((entry) => entry.key === runeachKey)?.required).toBe(true);
    expect(before.entries.find((entry) => entry.key === runeachKey)?.state).toBe("missing");

    const after = await syncCursorSkills(ctx, [runeachKey]);
    expect(after.entries.find((entry) => entry.key === runeachKey)?.state).toBe("installed");
    expect((await fs.lstat(path.join(home, ".cursor", "skills", "runeach"))).isSymbolicLink()).toBe(true);
  });

  it("recognizes company-library runtime skills supplied outside the bundled RunEach directory", async () => {
    const home = await makeTempDir("runeach-cursor-runtime-skills-home-");
    const runtimeSkills = await makeTempDir("runeach-cursor-runtime-skills-src-");
    cleanupDirs.add(home);
    cleanupDirs.add(runtimeSkills);

    const runeachDir = await createSkillDir(runtimeSkills, "runeach");
    const asciiHeartDir = await createSkillDir(runtimeSkills, "ascii-heart");

    const ctx = {
      agentId: "agent-3",
      companyId: "company-1",
      adapterType: "cursor",
      config: {
        env: {
          HOME: home,
        },
        runeachRuntimeSkills: [
          {
            key: "runeach",
            runtimeName: "runeach",
            source: runeachDir,
            required: true,
            requiredReason: "Bundled RunEach skills are always available for local adapters.",
          },
          {
            key: "ascii-heart",
            runtimeName: "ascii-heart",
            source: asciiHeartDir,
          },
        ],
        runeachSkillSync: {
          desiredSkills: ["ascii-heart"],
        },
      },
    } as const;

    const before = await listCursorSkills(ctx);
    expect(before.warnings).toEqual([]);
    expect(before.desiredSkills).toEqual(["runeach", "ascii-heart"]);
    expect(before.entries.find((entry) => entry.key === "ascii-heart")?.state).toBe("missing");

    const after = await syncCursorSkills(ctx, ["ascii-heart"]);
    expect(after.warnings).toEqual([]);
    expect(after.entries.find((entry) => entry.key === "ascii-heart")?.state).toBe("installed");
    expect((await fs.lstat(path.join(home, ".cursor", "skills", "ascii-heart"))).isSymbolicLink()).toBe(true);
  });

  it("keeps required bundled RunEach skills installed even when the desired set is emptied", async () => {
    const home = await makeTempDir("runeach-cursor-skill-prune-");
    cleanupDirs.add(home);

    const configuredCtx = {
      agentId: "agent-2",
      companyId: "company-1",
      adapterType: "cursor",
      config: {
        env: {
          HOME: home,
        },
        runeachSkillSync: {
          desiredSkills: [runeachKey],
        },
      },
    } as const;

    await syncCursorSkills(configuredCtx, [runeachKey]);

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

    const after = await syncCursorSkills(clearedCtx, []);
    expect(after.desiredSkills).toContain(runeachKey);
    expect(after.entries.find((entry) => entry.key === runeachKey)?.state).toBe("installed");
    expect((await fs.lstat(path.join(home, ".cursor", "skills", "runeach"))).isSymbolicLink()).toBe(true);
  });
});
