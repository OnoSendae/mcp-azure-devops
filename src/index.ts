import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createClient } from './wrapper/index.js';
import { initializeServer } from './server.js';

async function main() {
  try {
    const azureClient = await createClient();

    const server = new Server(
      {
        name: 'azure-devops-mcp',
        version: '1.0.0'
      },
      {
        capabilities: {
          resources: {},
          tools: {}
        }
      }
    );

    await initializeServer(server, azureClient);

    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error('Azure DevOps MCP server running on stdio');
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

