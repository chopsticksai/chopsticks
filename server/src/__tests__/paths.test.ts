import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resolveRunEachConfigPath } from "../paths.ts";

const ORIGINAL_CWD = process.cwd();
const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.chdir(ORIGINAL_CWD);
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) delete process.env[key];
  }
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("resolveRunEachConfigPath", () => {
  it("prefers repo-local .runeach config files", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "runeach-server-paths-"));
    const projectDir = path.join(tempDir, "repo");
    fs.mkdirSync(path.join(projectDir, ".runeach"), { recursive: true });
    fs.writeFileSync(path.join(projectDir, ".runeach", "config.json"), "{}\n");
    delete process.env.RUNEACH_CONFIG;
    process.chdir(projectDir);

    expect(resolveRunEachConfigPath()).toBe(path.join(projectDir, ".runeach", "config.json"));
  });
});
