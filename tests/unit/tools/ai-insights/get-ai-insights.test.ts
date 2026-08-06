import { describe, it, expect, afterEach } from "vitest";
import {
  mockFetchSuccess,
  mockFetchError,
  restoreFetch,
  getLastFetchUrl,
} from "../../../helpers/mockFetch.js";
import { createArgs } from "../../../helpers/mockTypes.js";
import { handleGetAiInsights } from "../../../../src/tools/ai-insights/get-ai-insights.js";

describe("handleGetAiInsights", () => {
  afterEach(() => {
    restoreFetch();
    delete process.env.TESTDINO_PAT;
  });

  it("throws when projectId is missing", async () => {
    process.env.TESTDINO_PAT = "test-pat";
    await expect(handleGetAiInsights(undefined)).rejects.toThrow(
      "projectId is required"
    );
  });

  it("project mode: only projectId, no run/case query params", async () => {
    mockFetchSuccess({ data: { summaryCards: {} } });

    await handleGetAiInsights(createArgs({ projectId: "proj-1" }) as never);

    const url = getLastFetchUrl();
    expect(url).toContain("/api/mcp/proj-1/get-ai-insights");
    expect(url).not.toContain("testrun_id");
    expect(url).not.toContain("testcase_id");
  });

  it("project overview forwards environment + dateRange filters", async () => {
    mockFetchSuccess({ data: {} });

    await handleGetAiInsights(
      createArgs({
        projectId: "proj-1",
        environment: "staging",
        dateRange: "30d",
      }) as never
    );

    const url = getLastFetchUrl();
    expect(url).toContain("environment=staging");
    expect(url).toContain("dateRange=30d");
  });

  it("run mode forwards testrun_id (and no testcase_id)", async () => {
    mockFetchSuccess({ testRunId: "run-1" });

    await handleGetAiInsights(
      createArgs({ projectId: "proj-1", testrun_id: "run-1" }) as never
    );

    const url = getLastFetchUrl();
    expect(url).toContain("testrun_id=run-1");
    expect(url).not.toContain("testcase_id");
  });

  it("case mode forwards both testrun_id and testcase_id", async () => {
    mockFetchSuccess({ testRunId: "run-1", testCaseId: "pw-abc" });

    await handleGetAiInsights(
      createArgs({
        projectId: "proj-1",
        testrun_id: "run-1",
        testcase_id: "pw-abc",
      }) as never
    );

    const url = getLastFetchUrl();
    expect(url).toContain("testrun_id=run-1");
    expect(url).toContain("testcase_id=pw-abc");
  });

  it("rejects case mode when testrun_id is missing (mirrors gateway guard)", async () => {
    await expect(
      handleGetAiInsights(
        createArgs({ projectId: "proj-1", testcase_id: "pw-abc" }) as never
      )
    ).rejects.toThrow("Case mode needs both testrun_id and testcase_id");
  });

  it("wraps an API failure with context", async () => {
    mockFetchError(500, "boom");

    await expect(
      handleGetAiInsights(
        createArgs({ projectId: "proj-1", testrun_id: "run-1" }) as never
      )
    ).rejects.toThrow("Failed to retrieve AI insights");
  });
});
