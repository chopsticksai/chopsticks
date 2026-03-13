import fs from "node:fs";
import { swarmifyxConfigSchema, type SwarmifyxConfig } from "@swarmifyx/shared";
import { resolveSwarmifyxConfigPath } from "./paths.js";

export function readConfigFile(): SwarmifyxConfig | null {
  const configPath = resolveSwarmifyxConfigPath();

  if (!fs.existsSync(configPath)) return null;

  try {
    const raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    return swarmifyxConfigSchema.parse(raw);
  } catch {
    return null;
  }
}
