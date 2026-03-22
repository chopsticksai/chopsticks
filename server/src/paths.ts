import fs from "node:fs";
import path from "node:path";
import { resolveDefaultConfigPath } from "./home-paths.js";

const RUNEACH_CONFIG_BASENAME = "config.json";
const RUNEACH_ENV_FILENAME = ".env";
const REPO_CONFIG_DIRNAME = ".runeach";

function findConfigFileFromAncestors(startDir: string): string | null {
  const absoluteStartDir = path.resolve(startDir);
  let currentDir = absoluteStartDir;

  while (true) {
    const candidate = path.resolve(currentDir, REPO_CONFIG_DIRNAME, RUNEACH_CONFIG_BASENAME);
    if (fs.existsSync(candidate)) {
      return candidate;
    }

    const nextDir = path.resolve(currentDir, "..");
    if (nextDir === currentDir) break;
    currentDir = nextDir;
  }

  return null;
}

export function resolveRunEachConfigPath(overridePath?: string): string {
  if (overridePath) return path.resolve(overridePath);
  if (process.env.RUNEACH_CONFIG) return path.resolve(process.env.RUNEACH_CONFIG);
  return findConfigFileFromAncestors(process.cwd()) ?? resolveDefaultConfigPath();
}

export function resolveRunEachEnvPath(overrideConfigPath?: string): string {
  return path.resolve(path.dirname(resolveRunEachConfigPath(overrideConfigPath)), RUNEACH_ENV_FILENAME);
}
