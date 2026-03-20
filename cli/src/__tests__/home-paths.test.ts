import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  describeLocalInstancePaths,
  expandHomePrefix,
  resolveAbacusHomeDir,
  resolveAbacusInstanceId,
} from "../config/home.js";

const ORIGINAL_ENV = { ...process.env };

describe("home path resolution", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  it("defaults to ~/.abacus and default instance", () => {
    delete process.env.ABACUS_HOME;
    delete process.env.ABACUS_INSTANCE_ID;
    const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), "abacus-home-"));
    vi.spyOn(os, "homedir").mockReturnValue(fakeHome);

    const paths = describeLocalInstancePaths();
    expect(paths.homeDir).toBe(path.resolve(fakeHome, ".abacus"));
    expect(paths.instanceId).toBe("default");
    expect(paths.configPath).toBe(path.resolve(fakeHome, ".abacus", "instances", "default", "config.json"));
  });

  it("supports ABACUS_HOME and explicit instance ids", () => {
    process.env.ABACUS_HOME = "~/abacus-home";

    const home = resolveAbacusHomeDir();
    expect(home).toBe(path.resolve(os.homedir(), "abacus-home"));
    expect(resolveAbacusInstanceId("dev_1")).toBe("dev_1");
  });

  it("rejects invalid instance ids", () => {
    expect(() => resolveAbacusInstanceId("bad/id")).toThrow(/Invalid instance id/);
  });

  it("expands ~ prefixes", () => {
    expect(expandHomePrefix("~")).toBe(os.homedir());
    expect(expandHomePrefix("~/x/y")).toBe(path.resolve(os.homedir(), "x/y"));
  });
});
