import fs from "node:fs";
import { chopsticksConfigSchema, type ChopsticksConfig } from "@chopsticks/shared";
import { resolveChopsticksConfigPath } from "./paths.js";

export function readConfigFile(): ChopsticksConfig | null {
  const configPath = resolveChopsticksConfigPath();

  if (!fs.existsSync(configPath)) return null;

  try {
    const raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    return chopsticksConfigSchema.parse(raw);
  } catch {
    return null;
  }
}
