import fs from "node:fs";
import { runeachConfigSchema, type RunEachConfig } from "@runeachai/shared";
import { resolveRunEachConfigPath } from "./paths.js";

export function readConfigFile(): RunEachConfig | null {
  const configPath = resolveRunEachConfigPath();

  if (!fs.existsSync(configPath)) return null;

  try {
    const raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    return runeachConfigSchema.parse(raw);
  } catch {
    return null;
  }
}
