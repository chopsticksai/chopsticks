import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const DEFAULT_INSTANCE_ID = "default";
const INSTANCE_ID_RE = /^[a-zA-Z0-9_-]+$/;
const DEFAULT_HOME_BASENAME = ".swarmifyx";
const LEGACY_HOME_BASENAME = ".swarmifyx";

function resolveDefaultSwarmifyxHomeDir(): string {
  return path.resolve(os.homedir(), DEFAULT_HOME_BASENAME);
}

function resolveLegacySwarmifyxHomeDir(): string {
  return path.resolve(os.homedir(), LEGACY_HOME_BASENAME);
}

export function resolveSwarmifyxHomeDir(): string {
  const envHome = process.env.SWARMIFYX_HOME?.trim();
  if (envHome) return path.resolve(expandHomePrefix(envHome));

  const preferredHome = resolveDefaultSwarmifyxHomeDir();
  const legacyHome = resolveLegacySwarmifyxHomeDir();
  if (!existsSync(preferredHome) && existsSync(legacyHome)) {
    throw new Error(
      `Legacy Swarmifyx home detected at ${legacyHome}. SwarmifyX now uses ${preferredHome} as the only default home. Move the directory or set SWARMIFYX_HOME explicitly during migration.`,
    );
  }
  return preferredHome;
}

export function resolveSwarmifyxInstanceId(override?: string): string {
  const raw = override?.trim() || process.env.SWARMIFYX_INSTANCE_ID?.trim() || DEFAULT_INSTANCE_ID;
  if (!INSTANCE_ID_RE.test(raw)) {
    throw new Error(
      `Invalid instance id '${raw}'. Allowed characters: letters, numbers, '_' and '-'.`,
    );
  }
  return raw;
}

export function resolveSwarmifyxInstanceRoot(instanceId?: string): string {
  const id = resolveSwarmifyxInstanceId(instanceId);
  return path.resolve(resolveSwarmifyxHomeDir(), "instances", id);
}

export function resolveDefaultConfigPath(instanceId?: string): string {
  return path.resolve(resolveSwarmifyxInstanceRoot(instanceId), "config.json");
}

export function resolveDefaultContextPath(): string {
  return path.resolve(resolveSwarmifyxHomeDir(), "context.json");
}

export function resolveDefaultEmbeddedPostgresDir(instanceId?: string): string {
  return path.resolve(resolveSwarmifyxInstanceRoot(instanceId), "db");
}

export function resolveDefaultLogsDir(instanceId?: string): string {
  return path.resolve(resolveSwarmifyxInstanceRoot(instanceId), "logs");
}

export function resolveDefaultSecretsKeyFilePath(instanceId?: string): string {
  return path.resolve(resolveSwarmifyxInstanceRoot(instanceId), "secrets", "master.key");
}

export function resolveDefaultStorageDir(instanceId?: string): string {
  return path.resolve(resolveSwarmifyxInstanceRoot(instanceId), "data", "storage");
}

export function resolveDefaultBackupDir(instanceId?: string): string {
  return path.resolve(resolveSwarmifyxInstanceRoot(instanceId), "data", "backups");
}

export function expandHomePrefix(value: string): string {
  if (value === "~") return os.homedir();
  if (value.startsWith("~/")) return path.resolve(os.homedir(), value.slice(2));
  return value;
}

export function describeLocalInstancePaths(instanceId?: string) {
  const resolvedInstanceId = resolveSwarmifyxInstanceId(instanceId);
  const instanceRoot = resolveSwarmifyxInstanceRoot(resolvedInstanceId);
  return {
    homeDir: resolveSwarmifyxHomeDir(),
    instanceId: resolvedInstanceId,
    instanceRoot,
    configPath: resolveDefaultConfigPath(resolvedInstanceId),
    embeddedPostgresDataDir: resolveDefaultEmbeddedPostgresDir(resolvedInstanceId),
    backupDir: resolveDefaultBackupDir(resolvedInstanceId),
    logDir: resolveDefaultLogsDir(resolvedInstanceId),
    secretsKeyFilePath: resolveDefaultSecretsKeyFilePath(resolvedInstanceId),
    storageDir: resolveDefaultStorageDir(resolvedInstanceId),
  };
}
