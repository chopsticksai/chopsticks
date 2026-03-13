import fs from "node:fs";
import path from "node:path";
import { resolveDefaultConfigPath } from "./home-paths.js";

const SWARMIFYX_CONFIG_BASENAME = "config.json";
const SWARMIFYX_ENV_FILENAME = ".env";
const REPO_CONFIG_DIRNAME = ".swarmifyx";
const LEGACY_REPO_CONFIG_DIRNAME = ".swarmifyx";

function resolveLegacyRepoLocalSentinel(dir: string): string | null {
  const legacyConfigPath = path.resolve(dir, LEGACY_REPO_CONFIG_DIRNAME, SWARMIFYX_CONFIG_BASENAME);
  if (fs.existsSync(legacyConfigPath)) {
    return legacyConfigPath;
  }

  const legacyEnvPath = path.resolve(dir, LEGACY_REPO_CONFIG_DIRNAME, SWARMIFYX_ENV_FILENAME);
  if (fs.existsSync(legacyEnvPath)) {
    return legacyEnvPath;
  }

  return null;
}

function findConfigFileFromAncestors(startDir: string): string | null {
  const absoluteStartDir = path.resolve(startDir);
  let currentDir = absoluteStartDir;

  while (true) {
    const candidate = path.resolve(currentDir, REPO_CONFIG_DIRNAME, SWARMIFYX_CONFIG_BASENAME);
    if (fs.existsSync(candidate)) {
      return candidate;
    }

    const legacySentinel = resolveLegacyRepoLocalSentinel(currentDir);
    if (legacySentinel) {
      const targetDir = path.resolve(currentDir, REPO_CONFIG_DIRNAME);
      throw new Error(
        `Legacy repo-local Swarmifyx files detected at ${legacySentinel}. SwarmifyX only auto-loads ${targetDir}. Move the repo-local files into ${targetDir} before rerunning this command.`,
      );
    }

    const nextDir = path.resolve(currentDir, "..");
    if (nextDir === currentDir) break;
    currentDir = nextDir;
  }

  return null;
}

export function resolveSwarmifyxConfigPath(overridePath?: string): string {
  if (overridePath) return path.resolve(overridePath);
  if (process.env.SWARMIFYX_CONFIG) return path.resolve(process.env.SWARMIFYX_CONFIG);
  return findConfigFileFromAncestors(process.cwd()) ?? resolveDefaultConfigPath();
}

export function resolveSwarmifyxEnvPath(overrideConfigPath?: string): string {
  return path.resolve(path.dirname(resolveSwarmifyxConfigPath(overrideConfigPath)), SWARMIFYX_ENV_FILENAME);
}
