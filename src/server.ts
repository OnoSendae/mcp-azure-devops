import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { AzureDevOpsClient } from './wrapper/index.js';
import { registerResources } from './mcp/resources/index.js';
import { registerTools } from './mcp/tools/index.js';

export async function initializeServer(
  server: Server,
  azureClient: AzureDevOpsClient
): Promise<void> {
  registerResources(server, azureClient);
  registerTools(server, azureClient);

  console.error('MCP server initialized');
  console.error('- Resources: 4 (my-tasks, bugs, all, project-info)');
  console.error('- Tools: 7 (create, update, delete, get, query, my-tasks, critical-bugs)');
}

