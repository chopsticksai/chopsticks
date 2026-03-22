// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AdapterEnvironmentTestResult } from "@abacus-lab/shared";
import { OnboardingWizard } from "./OnboardingWizard";

const mockAdapterModels = vi.fn();
const mockTestEnvironment = vi.fn();
const mockNavigate = vi.fn();
const mockCloseOnboarding = vi.fn();
const mockSetSelectedCompanyId = vi.fn();

vi.mock("../context/DialogContext", () => ({
  useDialog: () => ({
    onboardingOpen: true,
    onboardingOptions: { initialStep: 2, companyId: "company-1" },
    closeOnboarding: mockCloseOnboarding,
  }),
}));

vi.mock("../context/CompanyContext", () => ({
  useCompany: () => ({
    companies: [{ id: "company-1", issuePrefix: "ABC" }],
    setSelectedCompanyId: mockSetSelectedCompanyId,
    loading: false,
  }),
}));

vi.mock("../context/I18nContext", () => ({
  useI18n: () => ({
    locale: "en-US",
    localeOptions: [
      { value: "en-US", label: "English", nativeLabel: "English" },
      { value: "zh-CN", label: "Chinese", nativeLabel: "简体中文" },
    ],
    setLocale: vi.fn(),
    t: (value: string, vars?: Record<string, string>) =>
      value.replace(/\{(\w+)\}/g, (_match, key) => vars?.[key] ?? `{${key}}`),
  }),
}));

vi.mock("../api/agents", () => ({
  agentsApi: {
    adapterModels: (...args: unknown[]) => mockAdapterModels(...args),
    testEnvironment: (...args: unknown[]) => mockTestEnvironment(...args),
    create: vi.fn(),
    update: vi.fn(),
    invoke: vi.fn(),
  },
}));

vi.mock("../api/companies", () => ({
  companiesApi: {
    create: vi.fn(),
  },
}));

vi.mock("../api/goals", () => ({
  goalsApi: {
    create: vi.fn(),
  },
}));

vi.mock("../api/issues", () => ({
  issuesApi: {
    create: vi.fn(),
  },
}));

vi.mock("@/lib/router", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/onboarding" }),
  useParams: () => ({}),
}));

vi.mock("@/components/ui/dialog", async () => {
  const React = await import("react");
  return {
    Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
      open ? React.createElement(React.Fragment, null, children) : null,
    DialogPortal: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

vi.mock("./AsciiArtAnimation", () => ({
  AsciiArtAnimation: () => null,
}));

vi.mock("./PathInstructionsModal", () => ({
  ChoosePathButton: () => null,
}));

vi.mock("./agent-config-primitives", () => ({
  HintIcon: () => null,
}));

async function flushUi() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function waitFor(condition: () => boolean, message: string) {
  for (let i = 0; i < 25; i += 1) {
    if (condition()) return;
    await flushUi();
    await new Promise((resolve) => window.setTimeout(resolve, 0));
  }
  throw new Error(message);
}

async function click(element: Element | null) {
  if (!element) throw new Error("Expected element to exist");
  await act(async () => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function findButtonByText(text: string) {
  return Array.from(document.querySelectorAll("button")).find((button) =>
    button.textContent?.includes(text),
  ) ?? null;
}

function makeEnvResult(
  overrides: Partial<AdapterEnvironmentTestResult> = {},
): AdapterEnvironmentTestResult {
  return {
    adapterType: "pi_local",
    status: "pass",
    testedAt: "2026-03-22T12:00:00.000Z",
    checks: [
      {
        code: "pi_probe_passed",
        level: "info",
        message: "Probe passed",
      },
    ],
    ...overrides,
  };
}

async function renderWizard() {
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
        <OnboardingWizard />
      </QueryClientProvider>,
    );
  });

  await flushUi();

  return {
    async cleanup() {
      await act(async () => {
        root.unmount();
      });
      queryClient.clear();
      container.remove();
    },
  };
}

describe("OnboardingWizard", () => {
  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    mockNavigate.mockReset();
    mockCloseOnboarding.mockReset();
    mockSetSelectedCompanyId.mockReset();
    mockAdapterModels.mockReset();
    mockTestEnvironment.mockReset();
    mockAdapterModels.mockImplementation(async (_companyId: string, type: string) => {
      if (type === "pi_local") {
        return [{ id: "openai/gpt-4.1-mini", label: "openai/gpt-4.1-mini" }];
      }
      return [];
    });
    mockTestEnvironment.mockResolvedValue(makeEnvResult());
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("keeps the adapter environment check available for pi_local and probes pi_local", async () => {
    const view = await renderWizard();

    await click(findButtonByText("More Agent Adapter Types"));
    await click(findButtonByText("Local Pi agent"));

    await waitFor(
      () => document.body.textContent?.includes("Adapter environment check") ?? false,
      "Timed out waiting for the adapter environment card",
    );

    await click(findButtonByText("Test now"));

    await waitFor(
      () => mockTestEnvironment.mock.calls.length > 0,
      "Timed out waiting for testEnvironment to be called",
    );

    expect(mockTestEnvironment).toHaveBeenCalledWith(
      "company-1",
      "pi_local",
      expect.objectContaining({
        adapterConfig: expect.any(Object),
      }),
    );

    await view.cleanup();
  });

  it("shows pi as the manual debug command when a pi_local environment probe fails", async () => {
    mockTestEnvironment.mockResolvedValueOnce(
      makeEnvResult({
        status: "fail",
        checks: [
          {
            code: "pi_probe_failed",
            level: "error",
            message: "Probe failed",
          },
        ],
      }),
    );

    const view = await renderWizard();

    await click(findButtonByText("More Agent Adapter Types"));
    await click(findButtonByText("Local Pi agent"));
    await click(findButtonByText("Test now"));

    await waitFor(
      () => document.body.textContent?.includes("Manual debug") ?? false,
      "Timed out waiting for manual debug instructions",
    );

    expect(document.body.textContent).toContain("pi --print - --output-format stream-json --verbose");
    expect(document.body.textContent).not.toContain("claude --print - --output-format stream-json --verbose");

    await view.cleanup();
  });
});
