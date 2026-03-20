import fs from "node:fs";
import path from "node:path";
import { resolveDefaultConfigPath } from "./home-paths.js";

const ABACUS_CONFIG_BASENAME = "config.json";
const ABACUS_ENV_FILENAME = ".env";
const REPO_CONFIG_DIRNAME = ".abacus";

function findConfigFileFromAncestors(startDir: string): string | null {
  const absoluteStartDir = path.resolve(startDir);
  let currentDir = absoluteStartDir;

  while (true) {
    const candidate = path.resolve(currentDir, REPO_CONFIG_DIRNAME, ABACUS_CONFIG_BASENAME);
    if (fs.existsSync(candidate)) {
      return candidate;
    }

    const nextDir = path.resolve(currentDir, "..");
    if (nextDir === currentDir) break;
    currentDir = nextDir;
  }

  return null;
}

export function resolveAbacusConfigPath(overridePath?: string): string {
  if (overridePath) return path.resolve(overridePath);
  if (process.env.ABACUS_CONFIG) return path.resolve(process.env.ABACUS_CONFIG);
  return findConfigFileFromAncestors(process.cwd()) ?? resolveDefaultConfigPath();
}

export function resolveAbacusEnvPath(overrideConfigPath?: string): string {
  return path.resolve(path.dirname(resolveAbacusConfigPath(overrideConfigPath)), ABACUS_ENV_FILENAME);
}
