/**
 * Centralized API endpoints configuration
 */

import { getApiUrl } from "./env.js";

/**
 * Get the  base URL for API requests
 */
export function getBaseUrl(): string {
  const baseUrl = getApiUrl();
  return baseUrl;
}

/**
 * Build query string from parameters object
 */
function buildQueryString(params: Record<string, string | number | boolean | undefined | null>): string {
  const queryParams = new URLSearchParams();
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  }
  
  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * MCP API endpoints
 */
export const endpoints = {
  /**
   * List test runs with filters
   * GET /api/mcp/list-testruns
   */
  listTestRuns: (params?: {
    by_branch?: string;
    by_time_interval?: string;
    by_author?: string;
    by_commit?: string;
    by_environment?: string;
    by_pr?: string;
    limit?: number;
    page?: number;
    get_all?: string | boolean;
  }): string => {
    const baseUrl = getBaseUrl();
    const queryString = params ? buildQueryString(params) : "";
    return `${baseUrl}/api/mcp/list-testruns${queryString}`;
  },

  /**
   * Get detailed test run information by test run ID(s) - supports batch operations
   * GET /api/mcp/get-run-details
   * @param params.testrun_id - Optional: Single ID or comma-separated IDs (max 20). Example: 'run1' or 'run1,run2,run3'
   * @param params.counter - Optional: Filter by test run counter number
   */
  getRunDetails: (params: {
    testrun_id?: string; // Optional: Single ID or comma-separated IDs for batch (max 20)
    counter?: number;
  }): string => {
    const baseUrl = getBaseUrl();
    const queryString = buildQueryString(params);
    return `${baseUrl}/api/mcp/get-run-details${queryString}`;
  },

  /**
   * List test cases with comprehensive filtering options
   * GET /api/mcp/list-testcase
   * @param params.by_testrun_id - Optional: Single ID or comma-separated IDs (max 20). Required unless using counter, by_pages, or by_branch
   * @param params.counter - Optional: Test run counter number. Alternative to by_testrun_id
   * @param params.by_status - Optional: passed, failed, skipped, or flaky
   * @param params.by_spec_file_name - Optional: Filter by spec file name
   * @param params.by_error_category - Optional: Filter by error category
   * @param params.by_browser_name - Optional: Filter by browser name
   * @param params.by_tag - Optional: Filter by tag(s)
   * @param params.by_total_runtime - Optional: Filter by runtime (e.g., '<60', '>100')
   * @param params.by_artifacts - Optional: Filter by artifacts availability
   * @param params.by_error_message - Optional: Filter by error message
   * @param params.by_attempt_number - Optional: Filter by attempt number
   * @param params.by_pages - Optional: List by page number (doesn't require testrun_id/counter)
   * @param params.by_branch - Optional: Filter by branch (doesn't require testrun_id/counter)
   * @param params.by_time_interval - Optional: Filter by time interval
   * @param params.limit - Optional: Results per page
   * @param params.by_environment - Optional: Filter by environment
   * @param params.by_author - Optional: Filter by author
   * @param params.by_commit - Optional: Filter by commit hash
   * @param params.page - Optional: Page number
   * @param params.get_all - Optional: Get all results
   */
  listTestCases: (params?: {
    by_testrun_id?: string; // Single ID or comma-separated IDs for batch (max 20)
    counter?: number;
    by_status?: string;
    by_spec_file_name?: string;
    by_error_category?: string;
    by_browser_name?: string;
    by_tag?: string;
    by_total_runtime?: string;
    by_artifacts?: string | boolean;
    by_error_message?: string;
    by_attempt_number?: number;
    by_pages?: number;
    by_branch?: string;
    by_time_interval?: string;
    limit?: number;
    by_environment?: string;
    by_author?: string;
    by_commit?: string;
    page?: number;
    get_all?: string | boolean;
  }): string => {
    const baseUrl = getBaseUrl();
    const queryString = params ? buildQueryString(params) : "";
    return `${baseUrl}/api/mcp/list-testcase${queryString}`;
  },

  /**
   * Get detailed test case information
   * GET /api/mcp/get-testcase-details
   * @param params.testcaseid - Optional: Test case ID (can be used alone)
   * @param params.by_title - Optional: Test case name/title (must be combined with by_testrun_id or counter)
   * @param params.by_testrun_id - Optional: Test run ID (required when using by_title)
   * @param params.counter - Optional: Test run counter (required when using by_title if by_testrun_id not provided)
   */
  getTestCaseDetails: (params?: {
    testcaseid?: string; // Test case ID (can be used alone)
    by_title?: string; // Test case name (must be combined with by_testrun_id or counter)
    by_testrun_id?: string; // Test run ID (required when using by_title)
    counter?: string | number; // Test run counter (required when using by_title if by_testrun_id not provided)
  }): string => {
    const baseUrl = getBaseUrl();
    const queryString = params ? buildQueryString(params) : "";
    return `${baseUrl}/api/mcp/get-testcase-details${queryString}`;
  },

  /**
   * Hello/health check endpoint - validates API key and returns project name
   * GET /api/mcp/hello
   */
  hello: (): string => {
    const baseUrl = getBaseUrl();
    return `${baseUrl}/api/mcp/hello`;
  },
};
