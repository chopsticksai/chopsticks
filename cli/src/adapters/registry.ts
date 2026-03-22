import type { CLIAdapterModule } from "@runeachai/adapter-utils";
import { printClaudeStreamEvent } from "@runeachai/adapter-claude-local/cli";
import { printCodeBuddyStreamEvent } from "@runeachai/adapter-codebuddy-local/cli";
import { printCodexStreamEvent } from "@runeachai/adapter-codex-local/cli";
import { printCursorStreamEvent } from "@runeachai/adapter-cursor-local/cli";
import { printGeminiStreamEvent } from "@runeachai/adapter-gemini-local/cli";
import { printOpenCodeStreamEvent } from "@runeachai/adapter-opencode-local/cli";
import { printPiStreamEvent } from "@runeachai/adapter-pi-local/cli";
import { printOpenClawGatewayStreamEvent } from "@runeachai/adapter-openclaw-gateway/cli";
import { processCLIAdapter } from "./process/index.js";
import { httpCLIAdapter } from "./http/index.js";

const claudeLocalCLIAdapter: CLIAdapterModule = {
  type: "claude_local",
  formatStdoutEvent: printClaudeStreamEvent,
};

const codexLocalCLIAdapter: CLIAdapterModule = {
  type: "codex_local",
  formatStdoutEvent: printCodexStreamEvent,
};

const codeBuddyLocalCLIAdapter: CLIAdapterModule = {
  type: "codebuddy_local",
  formatStdoutEvent: printCodeBuddyStreamEvent,
};

const openCodeLocalCLIAdapter: CLIAdapterModule = {
  type: "opencode_local",
  formatStdoutEvent: printOpenCodeStreamEvent,
};

const piLocalCLIAdapter: CLIAdapterModule = {
  type: "pi_local",
  formatStdoutEvent: printPiStreamEvent,
};

const cursorLocalCLIAdapter: CLIAdapterModule = {
  type: "cursor",
  formatStdoutEvent: printCursorStreamEvent,
};

const geminiLocalCLIAdapter: CLIAdapterModule = {
  type: "gemini_local",
  formatStdoutEvent: printGeminiStreamEvent,
};

const openclawGatewayCLIAdapter: CLIAdapterModule = {
  type: "openclaw_gateway",
  formatStdoutEvent: printOpenClawGatewayStreamEvent,
};

const adaptersByType = new Map<string, CLIAdapterModule>(
  [
    claudeLocalCLIAdapter,
    codexLocalCLIAdapter,
    codeBuddyLocalCLIAdapter,
    openCodeLocalCLIAdapter,
    piLocalCLIAdapter,
    cursorLocalCLIAdapter,
    geminiLocalCLIAdapter,
    openclawGatewayCLIAdapter,
    processCLIAdapter,
    httpCLIAdapter,
  ].map((a) => [a.type, a]),
);

export function getCLIAdapter(type: string): CLIAdapterModule {
  return adaptersByType.get(type) ?? processCLIAdapter;
}
