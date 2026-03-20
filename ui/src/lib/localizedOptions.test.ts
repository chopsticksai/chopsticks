import { afterEach, describe, expect, it } from "vitest";
import { setActiveLocale, translateText } from "./i18n";
import {
  buildAgentThinkingEffortOptions,
  buildExecutionWorkspaceOptions,
  buildIssueStatusOptions,
} from "./localizedOptions";

const t = (text: string, values?: Record<string, string | number>) => translateText(text, values);

describe("localizedOptions", () => {
  afterEach(() => {
    setActiveLocale("en-US");
  });

  it("rebuilds option labels when the active locale changes", () => {
    setActiveLocale("en-US");
    const englishAgentOptions = buildAgentThinkingEffortOptions(t);
    const englishWorkspaceOptions = buildExecutionWorkspaceOptions(t);
    const englishStatusOptions = buildIssueStatusOptions();

    expect(englishAgentOptions.codeBuddy.at(-1)?.label).toBe("XHigh");
    expect(englishWorkspaceOptions[0]?.label).toBe("Project default");
    expect(englishStatusOptions[2]?.label).toBe("In Progress");

    setActiveLocale("zh-CN");
    const chineseAgentOptions = buildAgentThinkingEffortOptions(t);
    const chineseWorkspaceOptions = buildExecutionWorkspaceOptions(t);
    const chineseStatusOptions = buildIssueStatusOptions();

    expect(chineseAgentOptions.codeBuddy.at(-1)?.label).toBe("超高");
    expect(chineseWorkspaceOptions[0]?.label).toBe("项目默认");
    expect(chineseStatusOptions[2]?.label).toBe("进行中");
  });
});
