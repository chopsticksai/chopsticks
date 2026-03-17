import fs from "node:fs";
import path from "node:path";
import { resolveDefaultConfigPath } from "./home-paths.js";

const CHOPSTICKS_CONFIG_BASENAME = "config.json";
const CHOPSTICKS_ENV_FILENAME = ".env";
const REPO_CONFIG_DIRNAME = ".chopsticks";

function findConfigFileFromAncestors(startDir: string): string | null {
  const absoluteStartDir = path.resolve(startDir);
  let currentDir = absoluteStartDir;

  while (true) {
    const candidate = path.resolve(currentDir, REPO_CONFIG_DIRNAME, CHOPSTICKS_CONFIG_BASENAME);
    if (fs.existsSync(candidate)) {
      return candidate;
    }

    const nextDir = path.resolve(currentDir, "..");
    if (nextDir === currentDir) break;
    currentDir = nextDir;
  }

  return null;
}

export function resolveChopsticksConfigPath(overridePath?: string): string {
  if (overridePath) return path.resolve(overridePath);
  if (process.env.CHOPSTICKS_CONFIG) return path.resolve(process.env.CHOPSTICKS_CONFIG);
  return findConfigFileFromAncestors(process.cwd()) ?? resolveDefaultConfigPath();
}

export function resolveChopsticksEnvPath(overrideConfigPath?: string): string {
  return path.resolve(path.dirname(resolveChopsticksConfigPath(overrideConfigPath)), CHOPSTICKS_ENV_FILENAME);
}
