import fs from "node:fs";
import { pathToFileURL } from "node:url";

type ReadyMessage = {
  type: "ready";
  payload: {
    apiUrl: string;
  };
};

type FatalMessage = {
  type: "fatal";
  error: string;
};

function resolveServerEntrypoint(): string {
  const entry = process.env.ABACUS_DESKTOP_SERVER_ENTRY?.trim();
  if (!entry) {
    throw new Error("ABACUS_DESKTOP_SERVER_ENTRY is required.");
  }
  if (!fs.existsSync(entry)) {
    throw new Error(`Server entrypoint not found: ${entry}`);
  }
  return entry;
}

function applyDesktopEnvironment(): void {
  process.env.ABACUS_HOME = process.env.ABACUS_HOME?.trim() || process.cwd();
  process.env.ABACUS_INSTANCE_ID = process.env.ABACUS_INSTANCE_ID?.trim() || "default";
  process.env.HOST = "127.0.0.1";
  process.env.PORT = process.env.PORT?.trim() || "3100";
  process.env.ABACUS_OPEN_ON_LISTEN = "false";
}

async function loadServerModule(entryPath: string): Promise<() => Promise<{ apiUrl: string }>> {
  const mod = (await import(pathToFileURL(entryPath).href)) as {
    startServer?: () => Promise<{ apiUrl: string }>;
  };

  if (typeof mod.startServer !== "function") {
    throw new Error(`Entrypoint does not export startServer(): ${entryPath}`);
  }

  return mod.startServer;
}

function sendMessage(message: ReadyMessage | FatalMessage): void {
  if (typeof process.send === "function") {
    process.send(message);
  }
}

async function bootstrap(): Promise<void> {
  applyDesktopEnvironment();
  const entryPath = resolveServerEntrypoint();
  const startServer = await loadServerModule(entryPath);
  const started = await startServer();

  sendMessage({
    type: "ready",
    payload: {
      apiUrl: started.apiUrl,
    },
  });
}

process.once("disconnect", () => {
  process.exit(0);
});

process.on("uncaughtException", (error) => {
  sendMessage({ type: "fatal", error: error.stack ?? error.message });
});

process.on("unhandledRejection", (reason) => {
  const message = reason instanceof Error ? reason.stack ?? reason.message : String(reason);
  sendMessage({ type: "fatal", error: message });
});

void bootstrap().catch((error) => {
  sendMessage({ type: "fatal", error: error.stack ?? error.message });
});
