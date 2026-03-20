import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resolveAbacusConfigPath } from "../paths.ts";

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

describe("resolveAbacusConfigPath", () => {
  it("prefers repo-local .abacus config files", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "abacus-server-paths-"));
    const projectDir = path.join(tempDir, "repo");
    fs.mkdirSync(path.join(projectDir, ".abacus"), { recursive: true });
    fs.writeFileSync(path.join(projectDir, ".abacus", "config.json"), "{}\n");
    delete process.env.ABACUS_CONFIG;
    process.chdir(projectDir);

    expect(resolveAbacusConfigPath()).toBe(path.join(projectDir, ".abacus", "config.json"));
  });
});
