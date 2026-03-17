export const type = "qwen_local";
export const label = "Qwen Code (local)";
export const DEFAULT_QWEN_LOCAL_MODEL = "auto";

export const models = [
  { id: DEFAULT_QWEN_LOCAL_MODEL, label: "Auto" },
  { id: "qwen3-coder-plus", label: "Qwen3 Coder Plus" },
  { id: "qwen3-coder-next", label: "Qwen3 Coder Next" },
  { id: "qwen3-coder-flash", label: "Qwen3 Coder Flash" },
  { id: "qwen3.5-plus", label: "Qwen3.5 Plus" },
];

export const agentConfigurationDoc = `# qwen_local agent configuration

Adapter: qwen_local

Use when:
- You want Chopsticks to run Qwen Code locally on the host machine
- You want Qwen sessions resumed across heartbeats with --resume
- You want Chopsticks skills injected locally into ~/.qwen/skills without replacing the user's existing setup

Don't use when:
- You need webhook-style external invocation (use http or openclaw_gateway)
- You only need a one-shot script without an AI coding agent loop (use process)
- Qwen Code is not installed on the machine that runs Chopsticks

Core fields:
- cwd (string, optional): default absolute working directory fallback for the agent process (created if missing when possible)
- instructionsFilePath (string, optional): absolute path to a markdown instructions file prepended to the run prompt
- promptTemplate (string, optional): run prompt template
- model (string, optional): Qwen model id. Defaults to auto.
- sandbox (boolean, optional): run in sandbox mode (default: true, also sets QWEN_SANDBOX=true|false)
- command (string, optional): defaults to "qwen"
- extraArgs (string[], optional): additional CLI args
- env (object, optional): KEY=VALUE environment variables

Operational fields:
- timeoutSec (number, optional): run timeout in seconds
- graceSec (number, optional): SIGTERM grace period in seconds

Notes:
- Runs use the final positional argument for the prompt, not stdin and not -p/--prompt.
- Sessions resume with --resume when stored session cwd matches the current cwd.
- Chopsticks auto-injects local skills into \`~/.qwen/skills/\` via symlinks for missing entries only.
- Authentication can come from interactive \`qwen\` OAuth, \`~/.qwen/settings.json\`, or provider API keys such as DASHSCOPE_API_KEY / BAILIAN_CODING_PLAN_API_KEY / OPENAI_API_KEY.
`;
