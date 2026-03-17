import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  describeLocalInstancePaths,
  expandHomePrefix,
  resolveChopsticksHomeDir,
  resolveChopsticksInstanceId,
} from "../config/home.js";

const ORIGINAL_ENV = { ...process.env };

describe("home path resolution", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  it("defaults to ~/.chopsticks and default instance", () => {
    delete process.env.CHOPSTICKS_HOME;
    delete process.env.CHOPSTICKS_INSTANCE_ID;
    const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), "chopsticks-home-"));
    vi.spyOn(os, "homedir").mockReturnValue(fakeHome);

    const paths = describeLocalInstancePaths();
    expect(paths.homeDir).toBe(path.resolve(fakeHome, ".chopsticks"));
    expect(paths.instanceId).toBe("default");
    expect(paths.configPath).toBe(path.resolve(fakeHome, ".chopsticks", "instances", "default", "config.json"));
  });

  it("supports CHOPSTICKS_HOME and explicit instance ids", () => {
    process.env.CHOPSTICKS_HOME = "~/chopsticks-home";

    const home = resolveChopsticksHomeDir();
    expect(home).toBe(path.resolve(os.homedir(), "chopsticks-home"));
    expect(resolveChopsticksInstanceId("dev_1")).toBe("dev_1");
  });

  it("rejects invalid instance ids", () => {
    expect(() => resolveChopsticksInstanceId("bad/id")).toThrow(/Invalid instance id/);
  });

  it("expands ~ prefixes", () => {
    expect(expandHomePrefix("~")).toBe(os.homedir());
    expect(expandHomePrefix("~/x/y")).toBe(path.resolve(os.homedir(), "x/y"));
  });
});
