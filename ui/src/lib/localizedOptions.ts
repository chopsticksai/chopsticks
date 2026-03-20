import { getPriorityLabel, getStatusLabel } from "./i18n";

export type TranslateFn = (text: string, values?: Record<string, string | number>) => string;

export function buildAgentThinkingEffortOptions(t: TranslateFn) {
  return {
    codex: [
      { id: "", label: t("Auto") },
      { id: "minimal", label: t("Minimal") },
      { id: "low", label: t("Low") },
      { id: "medium", label: t("Medium") },
      { id: "high", label: t("High") },
    ],
    openCode: [
      { id: "", label: t("Auto") },
      { id: "minimal", label: t("Minimal") },
      { id: "low", label: t("Low") },
      { id: "medium", label: t("Medium") },
      { id: "high", label: t("High") },
      { id: "max", label: t("Max") },
    ],
    cursorMode: [
      { id: "", label: t("Auto") },
      { id: "plan", label: t("Plan") },
      { id: "ask", label: t("Ask") },
    ],
    codeBuddy: [
      { id: "", label: t("Auto") },
      { id: "low", label: t("Low") },
      { id: "medium", label: t("Medium") },
      { id: "high", label: t("High") },
      { id: "xhigh", label: t("XHigh") },
    ],
    claude: [
      { id: "", label: t("Auto") },
      { id: "low", label: t("Low") },
      { id: "medium", label: t("Medium") },
      { id: "high", label: t("High") },
    ],
  } as const;
}

export function buildIssueThinkingEffortOptions(t: TranslateFn) {
  return {
    claude_local: [
      { value: "", label: t("Default") },
      { value: "low", label: t("Low") },
      { value: "medium", label: t("Medium") },
      { value: "high", label: t("High") },
    ],
    codebuddy_local: [
      { value: "", label: t("Default") },
      { value: "low", label: t("Low") },
      { value: "medium", label: t("Medium") },
      { value: "high", label: t("High") },
      { value: "xhigh", label: t("XHigh") },
    ],
    codex_local: [
      { value: "", label: t("Default") },
      { value: "minimal", label: t("Minimal") },
      { value: "low", label: t("Low") },
      { value: "medium", label: t("Medium") },
      { value: "high", label: t("High") },
    ],
    opencode_local: [
      { value: "", label: t("Default") },
      { value: "minimal", label: t("Minimal") },
      { value: "low", label: t("Low") },
      { value: "medium", label: t("Medium") },
      { value: "high", label: t("High") },
      { value: "max", label: t("Max") },
    ],
  } as const;
}

export function buildExecutionWorkspaceOptions(t: TranslateFn) {
  return [
    { value: "shared_workspace", label: t("Project default") },
    { value: "isolated_workspace", label: t("New isolated workspace") },
    { value: "reuse_existing", label: t("Reuse existing workspace") },
  ] as const;
}

export function buildIssueStatusOptions() {
  return [
    { value: "backlog", label: getStatusLabel("backlog") },
    { value: "todo", label: getStatusLabel("todo") },
    { value: "in_progress", label: getStatusLabel("in_progress") },
    { value: "in_review", label: getStatusLabel("in_review") },
    { value: "done", label: getStatusLabel("done") },
  ] as const;
}

export function buildIssuePriorityOptions() {
  return [
    { value: "critical", label: getPriorityLabel("critical") },
    { value: "high", label: getPriorityLabel("high") },
    { value: "medium", label: getPriorityLabel("medium") },
    { value: "low", label: getPriorityLabel("low") },
  ] as const;
}
