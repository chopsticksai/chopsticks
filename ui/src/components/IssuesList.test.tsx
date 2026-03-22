// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Issue } from "@runeachai/shared";
import { I18nProvider } from "../context/I18nContext";
import { IssuesList } from "./IssuesList";

const mockOpenNewIssue = vi.fn();
const mockGetSession = vi.fn();
const mockListLabels = vi.fn();

vi.mock("../context/CompanyContext", () => ({
  useCompany: () => ({
    selectedCompanyId: "company-1",
    selectedCompany: null,
  }),
}));

vi.mock("@/context/CompanyContext", () => ({
  useCompany: () => ({
    selectedCompanyId: "company-1",
    selectedCompany: null,
  }),
}));

vi.mock("../context/DialogContext", () => ({
  useDialog: () => ({
    openNewIssue: mockOpenNewIssue,
  }),
}));

vi.mock("../api/auth", () => ({
  authApi: {
    getSession: (...args: unknown[]) => mockGetSession(...args),
  },
}));

vi.mock("../api/issues", () => ({
  issuesApi: {
    listLabels: (...args: unknown[]) => mockListLabels(...args),
    list: vi.fn(),
  },
}));

vi.mock("../lib/router", async () => {
  const React = await import("react");

  return {
    Link: ({ to, state: _state, children, ...props }: any) =>
      React.createElement("a", { href: to, ...props }, children),
  };
});

function makeIssue(overrides: Partial<Issue> & Pick<Issue, "id" | "title">): Issue {
  const now = new Date("2026-03-22T12:00:00.000Z");

  const base: Issue = {
    id: "",
    companyId: "company-1",
    projectId: null,
    projectWorkspaceId: null,
    goalId: null,
    parentId: null,
    title: "",
    description: null,
    status: "todo",
    priority: "medium",
    assigneeAgentId: null,
    assigneeUserId: null,
    checkoutRunId: null,
    executionRunId: null,
    executionAgentNameKey: null,
    executionLockedAt: null,
    createdByAgentId: null,
    createdByUserId: null,
    issueNumber: null,
    identifier: null,
    requestDepth: 0,
    billingCode: null,
    assigneeAdapterOverrides: null,
    executionWorkspaceId: null,
    executionWorkspacePreference: null,
    executionWorkspaceSettings: null,
    startedAt: null,
    completedAt: null,
    cancelledAt: null,
    hiddenAt: null,
    createdAt: now,
    updatedAt: now,
  };

  return { ...base, ...overrides };
}

async function flushUi() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function waitForText(text: string) {
  for (let i = 0; i < 20; i += 1) {
    if (document.body.textContent?.includes(text)) return;
    await flushUi();
    await new Promise((resolve) => window.setTimeout(resolve, 0));
  }
  throw new Error(`Timed out waiting for text: ${text}`);
}

async function click(element: Element | null) {
  if (!element) throw new Error("Expected element to exist");
  await act(async () => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

async function renderIssuesList(options?: {
  issues?: Issue[];
  agents?: Array<{ id: string; name: string }>;
  projects?: Array<{ id: string; name: string }>;
  viewStateKey?: string;
}) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  await act(async () => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <IssuesList
            issues={options?.issues ?? []}
            agents={options?.agents}
            projects={options?.projects}
            viewStateKey={options?.viewStateKey ?? "runeach:issues-view"}
            onUpdateIssue={vi.fn()}
          />
        </I18nProvider>
      </QueryClientProvider>,
    );
  });

  await flushUi();

  return {
    container,
    root,
    queryClient,
    async cleanup() {
      await act(async () => {
        root.unmount();
      });
      queryClient.clear();
      container.remove();
    },
  };
}

describe("IssuesList", () => {
  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    window.localStorage.clear();
    window.localStorage.setItem("runeach.locale", "zh-CN");
    mockOpenNewIssue.mockReset();
    mockGetSession.mockResolvedValue({
      session: { id: "session-1", userId: "user-1" },
      user: { id: "user-1", email: null, name: "Board User" },
    });
    mockListLabels.mockResolvedValue([]);
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("localizes the filters UI and clears project filters from persisted view state", async () => {
    window.localStorage.setItem(
      "runeach:issues-view:company-1",
      JSON.stringify({ projects: ["project-1"] }),
    );

    const view = await renderIssuesList({
      projects: [{ id: "project-1", name: "Alpha Project" }],
    });

    expect(document.body.textContent).toContain("没有任务符合当前筛选或搜索条件。");
    expect(document.body.textContent).toContain("创建任务");

    const filterButton = Array.from(document.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("筛选"),
    );
    await click(filterButton ?? null);
    await flushUi();

    expect(document.body.textContent).toContain("快捷筛选");
    expect(document.body.textContent).toContain("项目");
    expect(document.body.textContent).toContain("清除");

    const clearButton = Array.from(document.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "清除",
    );
    await click(clearButton ?? null);
    await flushUi();

    const stored = JSON.parse(
      window.localStorage.getItem("runeach:issues-view:company-1") ?? "{}",
    ) as { projects?: string[] };
    expect(stored.projects).toEqual([]);

    await view.cleanup();
  });

  it("keeps __me and __unassigned assignee filters working for user and unassigned issues", async () => {
    const issues = [
      makeIssue({ id: "issue-user", title: "Current user issue", assigneeUserId: "user-1" }),
      makeIssue({ id: "issue-open", title: "Unassigned issue" }),
      makeIssue({ id: "issue-agent", title: "Agent issue", assigneeAgentId: "agent-1" }),
    ];

    window.localStorage.setItem(
      "runeach:issues-view:company-1",
      JSON.stringify({ assignees: ["__me"] }),
    );

    const firstView = await renderIssuesList({
      issues,
      agents: [{ id: "agent-1", name: "Worker Agent" }],
    });

    await waitForText("Current user issue");
    expect(document.body.textContent).toContain("Current user issue");
    expect(document.body.textContent).not.toContain("Unassigned issue");
    expect(document.body.textContent).not.toContain("Agent issue");

    await firstView.cleanup();

    window.localStorage.setItem(
      "runeach:issues-view:company-1",
      JSON.stringify({ assignees: ["__unassigned"] }),
    );

    const secondView = await renderIssuesList({
      issues,
      agents: [{ id: "agent-1", name: "Worker Agent" }],
    });

    await waitForText("Unassigned issue");
    expect(document.body.textContent).toContain("Unassigned issue");
    expect(document.body.textContent).not.toContain("Current user issue");
    expect(document.body.textContent).not.toContain("Agent issue");

    await secondView.cleanup();
  });
});
