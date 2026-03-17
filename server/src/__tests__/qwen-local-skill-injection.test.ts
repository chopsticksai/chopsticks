import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ensureQwenSkillsInjected } from "@chopsticks/adapter-qwen-local/server";

async function makeTempDir(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

async function createSkillDir(root: string, name: string) {
  await fs.mkdir(path.join(root, name), { recursive: true });
}

describe("qwen local adapter skill injection", () => {
  const cleanupDirs = new Set<string>();

  afterEach(async () => {
    await Promise.all(Array.from(cleanupDirs).map((dir) => fs.rm(dir, { recursive: true, force: true })));
    cleanupDirs.clear();
  });

  it("links missing Chopsticks skills into Qwen skills home", async () => {
    const skillsDir = await makeTempDir("chopsticks-qwen-skills-src-");
    const skillsHome = await makeTempDir("chopsticks-qwen-skills-home-");
    cleanupDirs.add(skillsDir);
    cleanupDirs.add(skillsHome);

    await createSkillDir(skillsDir, "chopsticks");
    await createSkillDir(skillsDir, "chopsticks-create-agent");
    await fs.writeFile(path.join(skillsDir, "README.txt"), "ignore", "utf8");

    const logs: string[] = [];
    await ensureQwenSkillsInjected(
      async (_stream, chunk) => {
        logs.push(chunk);
      },
      { skillsDir, skillsHome },
    );

    const injectedA = path.join(skillsHome, "chopsticks");
    const injectedB = path.join(skillsHome, "chopsticks-create-agent");
    expect((await fs.lstat(injectedA)).isSymbolicLink()).toBe(true);
    expect((await fs.lstat(injectedB)).isSymbolicLink()).toBe(true);
    expect(await fs.realpath(injectedA)).toBe(await fs.realpath(path.join(skillsDir, "chopsticks")));
    expect(await fs.realpath(injectedB)).toBe(
      await fs.realpath(path.join(skillsDir, "chopsticks-create-agent")),
    );
    expect(logs.some((line) => line.includes('Injected Qwen skill "chopsticks"'))).toBe(true);
    expect(logs.some((line) => line.includes('Injected Qwen skill "chopsticks-create-agent"'))).toBe(true);
  });

  it("preserves existing targets and only links missing skills", async () => {
    const skillsDir = await makeTempDir("chopsticks-qwen-preserve-src-");
    const skillsHome = await makeTempDir("chopsticks-qwen-preserve-home-");
    cleanupDirs.add(skillsDir);
    cleanupDirs.add(skillsHome);

    await createSkillDir(skillsDir, "chopsticks");
    await createSkillDir(skillsDir, "chopsticks-create-agent");

    const existingTarget = path.join(skillsHome, "chopsticks");
    await fs.mkdir(existingTarget, { recursive: true });
    await fs.writeFile(path.join(existingTarget, "keep.txt"), "keep", "utf8");

    await ensureQwenSkillsInjected(async () => { }, { skillsDir, skillsHome });

    expect((await fs.lstat(existingTarget)).isDirectory()).toBe(true);
    expect(await fs.readFile(path.join(existingTarget, "keep.txt"), "utf8")).toBe("keep");
    expect((await fs.lstat(path.join(skillsHome, "chopsticks-create-agent"))).isSymbolicLink()).toBe(true);
  });

  it("logs per-skill link failures and continues without throwing", async () => {
    const skillsDir = await makeTempDir("chopsticks-qwen-fail-src-");
    const skillsHome = await makeTempDir("chopsticks-qwen-fail-home-");
    cleanupDirs.add(skillsDir);
    cleanupDirs.add(skillsHome);

    await createSkillDir(skillsDir, "ok-skill");
    await createSkillDir(skillsDir, "fail-skill");

    const logs: string[] = [];
    await ensureQwenSkillsInjected(
      async (_stream, chunk) => {
        logs.push(chunk);
      },
      {
        skillsDir,
        skillsHome,
        linkSkill: async (source, target) => {
          if (target.endsWith(`${path.sep}fail-skill`)) {
            throw new Error("simulated link failure");
          }
          await fs.symlink(source, target);
        },
      },
    );

    expect((await fs.lstat(path.join(skillsHome, "ok-skill"))).isSymbolicLink()).toBe(true);
    await expect(fs.lstat(path.join(skillsHome, "fail-skill"))).rejects.toThrow();
    expect(logs.some((line) => line.includes('Failed to inject Qwen skill "fail-skill"'))).toBe(true);
  });
});
