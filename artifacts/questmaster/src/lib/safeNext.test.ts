import { describe, expect, it } from "bun:test";
import { safeNextPath, signInPathFor } from "./safeNext";

describe("safeNextPath", () => {
  it("keeps a same-site path with its query", () => {
    expect(safeNextPath("/campaigns/abc?tab=table")).toBe("/campaigns/abc?tab=table");
  });
  it("refuses protocol-relative and backslash redirects", () => {
    expect(safeNextPath("//evil.com")).toBe("");
    expect(safeNextPath("/\\evil.com")).toBe("");
    expect(safeNextPath("/\t/evil.com")).toBe("");
  });
  it("refuses absolute URLs", () => {
    expect(safeNextPath("https://evil.com")).toBe("");
  });
});

describe("signInPathFor", () => {
  it("remembers the requested campaign page", () => {
    expect(signInPathFor("/campaigns/abc", "?tab=chat")).toBe("/sign-in?next=%2Fcampaigns%2Fabc%3Ftab%3Dchat");
  });
});
