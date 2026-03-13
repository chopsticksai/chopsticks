import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const DEFAULT_INSTANCE_ID = "default";
const CONFIG_BASENAME = "config.json";
const ENV_BASENAME = ".env";
const INSTANCE_ID_RE = /^[a-zA-Z0-9_-]+$/;
const REPO_CONFIG_DIRNAME = ".swarmifyx";
const LEGACY_REPO_CONFIG_DIRNAME = ".swarmifyx";

type PartialConfig = {
  database?: {
    mode?: "embedded-postgres" | "postgres";
    connectionString?: string;
    embeddedPostgresDataDir?: string;
    embeddedPostgresPort?: number;
    pgliteDataDir?: string;
    pglitePort?: number;
  };
};

export type ResolvedDatabaseTarget =
  | {
    mode: "postgres";
    connectionString: string;
    source: "DATABASE_URL" | "swarmifyx-env" | "config.database.connectionString";
    configPath: string;
    envPath: string;
  }
  | {
    mode: "embedded-postgres";
    dataDir: string;
    port: number;
    source: `embedded-postgres@${number}`;
    configPath: string;
    envPath: string;
  };

function expandHomePrefix(value: string): string {
  if (value === "~") return os.homedir();
  if (value.startsWith("~/")) return path.resolve(os.homedir(), value.slice(2));
  return value;
}

function resolveSwarmifyxHomeDir(): string {
  const envHome = process.env.SWARMIFYX_HOME?.trim();
  if (envHome) return path.resolve(expandHomePrefix(envHome));

  const preferredHome = path.resolve(os.homedir(), REPO_CONFIG_DIRNAME);
  const legacyHome = path.resolve(os.homedir(), LEGACY_REPO_CONFIG_DIRNAME);
  if (!existsSync(preferredHome) && existsSync(legacyHome)) {
    throw new Error(
      `Legacy Swarmifyx home detected at ${legacyHome}. SwarmifyX now uses ${preferredHome} as the only default home. Move the directory or set SWARMIFYX_HOME explicitly during migration.`,
    );
  }
  return preferredHome;
}

function resolveSwarmifyxInstanceId(): string {
  const raw = process.env.SWARMIFYX_INSTANCE_ID?.trim() || DEFAULT_INSTANCE_ID;
  if (!INSTANCE_ID_RE.test(raw)) {
    throw new Error(`Invalid SWARMIFYX_INSTANCE_ID '${raw}'.`);
  }
  return raw;
}

function resolveDefaultConfigPath(): string {
  return path.resolve(
    resolveSwarmifyxHomeDir(),
    "instances",
    resolveSwarmifyxInstanceId(),
    CONFIG_BASENAME,
  );
}

function resolveDefaultEmbeddedPostgresDir(): string {
  return path.resolve(resolveSwarmifyxHomeDir(), "instances", resolveSwarmifyxInstanceId(), "db");
}

function resolveHomeAwarePath(value: string): string {
  return path.resolve(expandHomePrefix(value));
}

function resolveLegacyRepoLocalSentinel(dir: string): string | null {
  const legacyConfigPath = path.resolve(dir, LEGACY_REPO_CONFIG_DIRNAME, CONFIG_BASENAME);
  if (existsSync(legacyConfigPath)) return legacyConfigPath;

  const legacyEnvPath = path.resolve(dir, LEGACY_REPO_CONFIG_DIRNAME, ENV_BASENAME);
  if (existsSync(legacyEnvPath)) return legacyEnvPath;

  return null;
}

function findConfigFileFromAncestors(startDir: string): string | null {
  let currentDir = path.resolve(startDir);

  while (true) {
    const candidate = path.resolve(currentDir, REPO_CONFIG_DIRNAME, CONFIG_BASENAME);
    if (existsSync(candidate)) return candidate;

    const legacySentinel = resolveLegacyRepoLocalSentinel(currentDir);
    if (legacySentinel) {
      const targetDir = path.resolve(currentDir, REPO_CONFIG_DIRNAME);
      throw new Error(
        `Legacy repo-local Swarmifyx files detected at ${legacySentinel}. SwarmifyX only auto-loads ${targetDir}. Move the repo-local files into ${targetDir} before rerunning this command.`,
      );
    }

    const nextDir = path.resolve(currentDir, "..");
    if (nextDir === currentDir) return null;
    currentDir = nextDir;
  }
}

function resolveSwarmifyxConfigPath(): string {
  if (process.env.SWARMIFYX_CONFIG?.trim()) {
    return path.resolve(process.env.SWARMIFYX_CONFIG.trim());
  }
  return findConfigFileFromAncestors(process.cwd()) ?? resolveDefaultConfigPath();
}

function resolveSwarmifyxEnvPath(configPath: string): string {
  return path.resolve(path.dirname(configPath), ENV_BASENAME);
}

function parseEnvFile(contents: string): Record<string, string> {
  const entries: Record<string, string> = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const match = rawLine.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    const value = rawValue.trim();
    if (!value) {
      entries[key] = "";
      continue;
    }

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      entries[key] = value.slice(1, -1);
      continue;
    }

    entries[key] = value.replace(/\s+#.*$/, "").trim();
  }

  return entries;
}

function readEnvEntries(envPath: string): Record<string, string> {
  if (!existsSync(envPath)) return {};
  return parseEnvFile(readFileSync(envPath, "utf8"));
}

function migrateLegacyConfig(raw: unknown): PartialConfig | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;

  const config = { ...(raw as Record<string, unknown>) };
  const databaseRaw = config.database;
  if (typeof databaseRaw !== "object" || databaseRaw === null || Array.isArray(databaseRaw)) {
    return config;
  }

  const database = { ...(databaseRaw as Record<string, unknown>) };
  if (database.mode === "pglite") {
    database.mode = "embedded-postgres";

    if (
      typeof database.embeddedPostgresDataDir !== "string" &&
      typeof database.pgliteDataDir === "string"
    ) {
      database.embeddedPostgresDataDir = database.pgliteDataDir;
    }
    if (
      typeof database.embeddedPostgresPort !== "number" &&
      typeof database.pglitePort === "number" &&
      Number.isFinite(database.pglitePort)
    ) {
      database.embeddedPostgresPort = database.pglitePort;
    }
  }

  config.database = database;
  return config as PartialConfig;
}

function asPositiveInt(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const rounded = Math.trunc(value);
  return rounded > 0 ? rounded : null;
}

function readConfig(configPath: string): PartialConfig | null {
  if (!existsSync(configPath)) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(configPath, "utf8"));
  } catch (err) {
    throw new Error(
      `Failed to parse config at ${configPath}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const migrated = migrateLegacyConfig(parsed);
  if (migrated === null || typeof migrated !== "object" || Array.isArray(migrated)) {
    throw new Error(`Invalid config at ${configPath}: expected a JSON object`);
  }

  const database =
    typeof migrated.database === "object" &&
      migrated.database !== null &&
      !Array.isArray(migrated.database)
      ? migrated.database
      : undefined;

  return {
    database: database
      ? {
        mode: database.mode === "postgres" ? "postgres" : "embedded-postgres",
        connectionString:
          typeof database.connectionString === "string" ? database.connectionString : undefined,
        embeddedPostgresDataDir:
          typeof database.embeddedPostgresDataDir === "string"
            ? database.embeddedPostgresDataDir
            : undefined,
        embeddedPostgresPort: asPositiveInt(database.embeddedPostgresPort) ?? undefined,
        pgliteDataDir: typeof database.pgliteDataDir === "string" ? database.pgliteDataDir : undefined,
        pglitePort: asPositiveInt(database.pglitePort) ?? undefined,
      }
      : undefined,
  };
}

export function resolveDatabaseTarget(): ResolvedDatabaseTarget {
  const configPath = resolveSwarmifyxConfigPath();
  const envPath = resolveSwarmifyxEnvPath(configPath);
  const envEntries = readEnvEntries(envPath);

  const envUrl = process.env.DATABASE_URL?.trim();
  if (envUrl) {
    return {
      mode: "postgres",
      connectionString: envUrl,
      source: "DATABASE_URL",
      configPath,
      envPath,
    };
  }

  const fileEnvUrl = envEntries.DATABASE_URL?.trim();
  if (fileEnvUrl) {
    return {
      mode: "postgres",
      connectionString: fileEnvUrl,
      source: "swarmifyx-env",
      configPath,
      envPath,
    };
  }

  const config = readConfig(configPath);
  const connectionString = config?.database?.connectionString?.trim();
  if (config?.database?.mode === "postgres" && connectionString) {
    return {
      mode: "postgres",
      connectionString,
      source: "config.database.connectionString",
      configPath,
      envPath,
    };
  }

  const port = config?.database?.embeddedPostgresPort ?? 54329;
  const dataDir = resolveHomeAwarePath(
    config?.database?.embeddedPostgresDataDir ?? resolveDefaultEmbeddedPostgresDir(),
  );

  return {
    mode: "embedded-postgres",
    dataDir,
    port,
    source: `embedded-postgres@${port}`,
    configPath,
    envPath,
  };
}
