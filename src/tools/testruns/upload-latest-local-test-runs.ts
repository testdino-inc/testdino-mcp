/**
 * Upload latest local test runs tool
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { resolve, dirname, join } from "path";
import { getApiKey } from "../../lib/env.js";

/**
 * Find the git repository root by walking up from the given path
 */
function findGitRoot(startPath: string): string | null {
  let currentPath = resolve(startPath);
  const maxDepth = 20;
  let depth = 0;

  while (depth < maxDepth) {
    const gitPath = join(currentPath, ".git");
    if (existsSync(gitPath)) {
      return currentPath;
    }
    const parentPath = dirname(currentPath);
    if (parentPath === currentPath) {
      break; // Reached filesystem root
    }
    currentPath = parentPath;
    depth++;
  }
  return null;
}


export const uploadLatestLocalTestRunsTool = {
  name: "upload_latest_local_test_runs",
  description:
    "Upload your local Playwright test results to TestDino. After running tests locally, upload the report to track and analyze results. Automatically detects git info (branch, commit, author). Use absolute paths for best results.",
  inputSchema: {
    type: "object",
    properties: {
      reportDir: {
        type: "string",
        description: "Path to Playwright report directory. Use absolute path (e.g., '/Users/jon/project/playwright-report' or 'C:\\Users\\jon\\project\\playwright-report'). Default: './playwright-report'.",
        default: "./playwright-report",
      },
      uploadHtml: {
        type: "boolean",
        description: "Upload HTML reports with all data (JSON, images, videos). Recommended. Default: true.",
        default: true,
      },
      uploadImages: {
        type: "boolean",
        description: "Upload screenshot images. Default: false (included in uploadHtml).",
        default: false,
      },
      uploadVideos: {
        type: "boolean",
        description: "Upload test execution videos. Default: false (included in uploadHtml).",
        default: false,
      },
      uploadTraces: {
        type: "boolean",
        description: "Upload Playwright trace files for debugging. Default: false.",
        default: false,
      },
      uploadFiles: {
        type: "boolean",
        description: "Upload file attachments (.md, .pdf, .txt, .log). Default: false.",
        default: false,
      },
      uploadFullJson: {
        type: "boolean",
        description: "Upload complete JSON bundle with all artifacts (alternative to uploadHtml). Default: false.",
        default: false,
      },
      jsonReport: {
        type: "string",
        description: "Specific JSON report file path (overrides reportDir).",
      },
      htmlReport: {
        type: "string",
        description: "Specific HTML report path (overrides reportDir).",
      },
      traceDir: {
        type: "string",
        description: "Specific trace directory path (overrides reportDir).",
      },
      verbose: {
        type: "boolean",
        description: "Show detailed logging. Default: false.",
        default: false,
      },
    },
    required: [],
  },
};

export async function handleUploadLatestLocalTestRuns(args: any) {
  const reportDir = args?.reportDir || "./playwright-report";
  const uploadHtml = args?.uploadHtml === undefined ? true : Boolean(args?.uploadHtml);
  const uploadImages = Boolean(args?.uploadImages);
  const uploadVideos = Boolean(args?.uploadVideos);
  const uploadTraces = Boolean(args?.uploadTraces);
  const uploadFiles = Boolean(args?.uploadFiles);
  const uploadFullJson = Boolean(args?.uploadFullJson);
  const jsonReport = args?.jsonReport;
  const htmlReport = args?.htmlReport;
  const traceDir = args?.traceDir;
  const verbose = Boolean(args?.verbose);
  const token = getApiKey(args);

  if (!token) {
    throw new Error(
      "Missing TESTDINO_API_KEY environment variable. " +
        "Please configure it in your .cursor/mcp.json file under the 'env' section."
    );
  }

  // Determine runtime dynamically based on API key using regex
  let runtime = "development"; // default
  const tokenMatch = String(token).match(/^trx_([a-z]+)_/i);
  if (tokenMatch && tokenMatch[1]) {
    const env = tokenMatch[1].toLowerCase();
    if (["production", "staging", "development"].includes(env)) {
      runtime = env;
    }
  }


  try {
    // Resolve report directory path (only if jsonReport/htmlReport/traceDir are not provided)
    let resolvedReportDir: string | undefined;
    let projectRoot: string = process.cwd();

    if (!jsonReport && !htmlReport && !traceDir) {
      const reportDirStr = String(reportDir);
      
      // Check if reportDir is an absolute path
      if (reportDirStr.startsWith("/") || /^[A-Za-z]:/.test(reportDirStr)) {
        // Absolute path - use as-is
        resolvedReportDir = reportDirStr;
      } else {
        // Relative path - find git root (project directory) first
        // Git root gives us the actual project directory like /Users/ashish/Desktop/demostore-testdino
        const gitRoot = findGitRoot(process.cwd());
        
        if (gitRoot) {
          // Found git root - this is our project directory
          resolvedReportDir = resolve(gitRoot, reportDirStr);
          projectRoot = gitRoot;
        } else {
          // No git root found - use current working directory as fallback
          resolvedReportDir = resolve(process.cwd(), reportDirStr);
          projectRoot = process.cwd();
        }
      }

      // Check if the directory exists
      if (!existsSync(resolvedReportDir)) {
        throw new Error(
          `Report directory does not exist: ${resolvedReportDir}\n` +
          `Please ensure the Playwright report has been generated at: ${reportDir}\n` +
          `Searched from: ${projectRoot || process.cwd()}\n` +
          `Tip: Use an absolute path if the report is in a different location.`
        );
      }

      // Find git repository root from the resolved report directory (if not already found)
      if (!projectRoot || projectRoot === process.cwd()) {
        const gitRoot = findGitRoot(resolvedReportDir);
        if (gitRoot) {
          projectRoot = gitRoot;
        } else {
          // If no git root found, use the directory containing the report
          projectRoot = dirname(resolvedReportDir);
        }
      }
    } else {
      // If specific paths are provided, try to find git root from them
      const pathToCheck = jsonReport || htmlReport || traceDir;
      if (pathToCheck) {
        const pathStr = String(pathToCheck);
        let resolvedPath: string;
        
        // Check if it's an absolute path
        if (pathStr.startsWith("/") || /^[A-Za-z]:/.test(pathStr)) {
          resolvedPath = pathStr;
        } else {
          // Try to find git root first
          const gitRootFromCwd = findGitRoot(process.cwd());
          const basePath = gitRootFromCwd || process.cwd();
          resolvedPath = resolve(basePath, pathStr);
        }
        
        const gitRoot = findGitRoot(resolvedPath);
        if (gitRoot) {
          projectRoot = gitRoot;
        }
      }
    }

    // Build the command: npx tdpw upload [reportDir] --token=<token> [options]
    // Note: TESTDINO_RUNTIME is set via the env option in execSync (cross-platform compatible)
    const cmdParts = [
      "npx",
      "tdpw",
      "upload",
    ];

    // Add report directory or specific paths
    if (resolvedReportDir) {
      cmdParts.push(resolvedReportDir);
    }

    // Add token (ensure it's a string and wrapped in double quotes)
    cmdParts.push(`--token="${token}"`);

    // Add upload options (order matters for some flags)
    if (uploadFullJson) {
      cmdParts.push("--upload-full-json");
    } else {
      // Individual upload options (only if uploadFullJson is not set)
      if (uploadHtml) {
        cmdParts.push("--upload-html");
      }
      if (uploadImages) {
        cmdParts.push("--upload-images");
      }
      if (uploadVideos) {
        cmdParts.push("--upload-videos");
      }
      if (uploadTraces) {
        cmdParts.push("--upload-traces");
      }
      if (uploadFiles) {
        cmdParts.push("--upload-files");
      }
    }

    // Add specific report paths
    if (jsonReport) {
      cmdParts.push(`--json-report=${jsonReport}`);
    }
    if (htmlReport) {
      cmdParts.push(`--html-report=${htmlReport}`);
    }
    if (traceDir) {
      cmdParts.push(`--trace-dir=${traceDir}`);
    }

    // Add verbose flag
    if (verbose) {
      cmdParts.push("--verbose");
    }

    const cmd = cmdParts.join(" ");

    // Execute command with TESTDINO_RUNTIME environment variable
    const env = {
      ...process.env,
      TESTDINO_RUNTIME: runtime,
    };

    let output: string;
    let stderr: string = "";
    try {
      // Execute from the git repository root so git metadata can be detected
      output = execSync(cmd, {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "pipe"],
        cwd: projectRoot,
        env: env,
      }) as string;
    } catch (execError: any) {
      output = execError.stdout || "";
      stderr = execError.stderr || "";
      throw execError;
    }

    const successMessage = output.trim()
      ? `✅ Report uploaded successfully!\n\nOutput:\n${output}`
      : `✅ Report uploaded successfully!`;

    return {
      content: [
        {
          type: "text",
          text: successMessage,
        },
      ],
    };
  } catch (error: any) {
    const stderr = error?.stderr || "";
    const stdout = error?.stdout || "";

    const errorMessage = `❌ Upload failed.\n\nError: ${error?.message || "Unknown error"}\n\n${
      stderr ? `Stderr:\n${stderr}\n\n` : ""
    }${stdout ? `Stdout:\n${stdout}\n\n` : ""}Please check:\n1. The report directory exists: ${reportDir}\n2. Your TestDino token is valid\n3. You have internet connectivity\n4. The tdpw package is available (try: npx tdpw --help)`;

    return {
      content: [
        {
          type: "text",
          text: errorMessage,
        },
      ],
    };
  }
}
