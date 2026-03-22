import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  describeLocalInstancePaths,
  expandHomePrefix,
  resolveRunEachHomeDir,
  resolveRunEachInstanceId,
} from "../config/home.js";

const ORIGINAL_ENV = { ...process.env };

describe("home path resolution", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  it("defaults to ~/.runeach and default instance", () => {
    delete process.env.RUNEACH_HOME;
    delete process.env.RUNEACH_INSTANCE_ID;
    const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), "runeach-home-"));
    vi.spyOn(os, "homedir").mockReturnValue(fakeHome);

    const paths = describeLocalInstancePaths();
    expect(paths.homeDir).toBe(path.resolve(fakeHome, ".runeach"));
    expect(paths.instanceId).toBe("default");
    expect(paths.configPath).toBe(path.resolve(fakeHome, ".runeach", "instances", "default", "config.json"));
  });

  it("supports RUNEACH_HOME and explicit instance ids", () => {
    process.env.RUNEACH_HOME = "~/runeach-home";

    const home = resolveRunEachHomeDir();
    expect(home).toBe(path.resolve(os.homedir(), "runeach-home"));
    expect(resolveRunEachInstanceId("dev_1")).toBe("dev_1");
  });

  it("rejects invalid instance ids", () => {
    expect(() => resolveRunEachInstanceId("bad/id")).toThrow(/Invalid instance id/);
  });

  it("expands ~ prefixes", () => {
    expect(expandHomePrefix("~")).toBe(os.homedir());
    expect(expandHomePrefix("~/x/y")).toBe(path.resolve(os.homedir(), "x/y"));
  });
});
