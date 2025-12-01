/**
 * Health tool - Health check and API key validation
 */

import { endpoints } from "../lib/endpoints.js";
import { apiRequestJson } from "../lib/request.js";
import { getApiKey } from "../lib/env.js";

export const healthTool = {
  name: "health",
  description:
    "Check if your TestDino connection is working. Verifies your API key and shows your project name. Use this first to make sure everything is set up correctly.",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Your name (used in the greeting message).",
      },
    },
    required: ["name"],
  },
};

export async function handleHealth(args: any) {
  const userName = args?.name || "World";

  // Validate API key and get project info using /api/mcp/hello endpoint
  let projectInfoSummary = "";
  try {
    // Read API key from environment variable (set in mcp.json) or from args
    const token = getApiKey(args);

    if (token) {
      const helloEndpoint = endpoints.hello();
      const response = await apiRequestJson<{
        success?: boolean;
        message?: string;
        data?: {
          authenticated: boolean;
          projectId: string;
          projectName: string;
        };
        // Also handle direct response structure (fallback)
        authenticated?: boolean;
        projectId?: string;
        projectName?: string;
      }>(helloEndpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Handle wrapped response structure (success helper format)
      const data = response.data || response;
      const authenticated = data.authenticated;
      const projectId = data.projectId;
      const projectName = data.projectName;

      if (authenticated) {
        projectInfoSummary = `\n\n✅ API key validated successfully!\n`;
        projectInfoSummary += `Project Name: ${projectName || "N/A"}\n`;
        projectInfoSummary += `Project ID: ${projectId || "N/A"}`;
      }
    } else {
      projectInfoSummary = "\n\n⚠️ No TESTDINO_API_KEY available to verify";
    }
  } catch (e: any) {
    projectInfoSummary = `\n\n❌ Error validating API key: ${e?.message || String(e)}`;
  }

  return {
    content: [
      {
        type: "text",
        text: `Hello, ${userName}! 👋\n\nThis is TestDino's MCP server responding.${projectInfoSummary}`,
      },
    ],
  };
}

