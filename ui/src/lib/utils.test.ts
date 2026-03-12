// @vitest-environment node

import { describe, expect, it } from "vitest";
import { formatTime } from "./utils";

describe("formatTime", () => {
  it("keeps partial options as time-only output", () => {
    const result = formatTime(new Date(2026, 2, 12, 15, 4, 5), { hour12: false });

    expect(result).toContain(":");
    expect(result).not.toMatch(/\d{1,4}[\/.-]\d{1,2}[\/.-]\d{1,4}/);
  });
});
