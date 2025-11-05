import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { AzureDevOpsClient } from '../../wrapper/index.js';

async function getMyTasksResource(client: AzureDevOpsClient) {
  const query = `SELECT [System.Id], [System.Title], [System.State], [Microsoft.VSTS.Common.Priority]
FROM WorkItems
WHERE [System.AssignedTo] = @Me
AND [System.State] <> 'Done'
ORDER BY [Microsoft.VSTS.Common.Priority]`;

  const items = await client.wiql.queryAndGet(query, ['System.Id', 'System.Title', 'System.State', 'Microsoft.VSTS.Common.Priority'], { top: 50 });

  return {
    contents: [
      {
        uri: 'azure://work-items/my-tasks',
        mimeType: 'application/json',
        text: JSON.stringify(items, null, 2)
      }
    ]
  };
}

async function getBugsResource(client: AzureDevOpsClient) {
  const query = `SELECT [System.Id], [System.Title], [System.State], [Microsoft.VSTS.Common.Priority]
FROM WorkItems
WHERE [System.WorkItemType] = 'Bug'
AND [System.State] <> 'Done'
ORDER BY [Microsoft.VSTS.Common.Priority], [System.CreatedDate] DESC`;

  const items = await client.wiql.queryAndGet(query, ['System.Id', 'System.Title', 'System.State', 'Microsoft.VSTS.Common.Priority'], { top: 100 });

  return {
    contents: [
      {
        uri: 'azure://work-items/bugs',
        mimeType: 'application/json',
        text: JSON.stringify(items, null, 2)
      }
    ]
  };
}

async function getAllWorkItemsResource(client: AzureDevOpsClient) {
  const query = `SELECT [System.Id], [System.Title], [System.WorkItemType], [System.State]
FROM WorkItems
ORDER BY [System.ChangedDate] DESC`;

  const items = await client.wiql.queryAndGet(query, ['System.Id', 'System.Title', 'System.WorkItemType', 'System.State'], { top: 200 });

  return {
    contents: [
      {
        uri: 'azure://work-items/all',
        mimeType: 'application/json',
        text: JSON.stringify(items, null, 2)
      }
    ]
  };
}

async function getProjectInfoResource(client: AzureDevOpsClient) {
  const health = client.health;

  const info = {
    server: 'azure-devops-mcp',
    version: '1.0.0',
    health: {
      initialized: health.initialized,
      provider: health.provider,
      circuitBreaker: health.circuitBreaker,
      rateLimitAvailable: health.rateLimit
    }
  };

  return {
    contents: [
      {
        uri: 'azure://project/info',
        mimeType: 'application/json',
        text: JSON.stringify(info, null, 2)
      }
    ]
  };
}

async function getBoardsListResource(client: AzureDevOpsClient) {
  const boards = await client.boards.list();

  return {
    contents: [
      {
        uri: 'azure://boards/list',
        mimeType: 'application/json',
        text: JSON.stringify(boards, null, 2)
      }
    ]
  };
}

async function getBoardConfigResource(client: AzureDevOpsClient, boardId: string) {
  const board = await client.boards.get(boardId);

  return {
    contents: [
      {
        uri: `azure://boards/${boardId}/config`,
        mimeType: 'application/json',
        text: JSON.stringify(board, null, 2)
      }
    ]
  };
}

async function getAllIterationsResource(client: AzureDevOpsClient) {
  const iterations = await client.iterations.list();

  return {
    contents: [
      {
        uri: 'azure://iterations/all',
        mimeType: 'application/json',
        text: JSON.stringify(iterations, null, 2)
      }
    ]
  };
}

async function getCurrentIterationResource(client: AzureDevOpsClient) {
  const iterations = await client.iterations.list();
  const currentIteration = iterations.find(iter => iter.attributes.timeFrame === 'current');

  if (!currentIteration) {
    return {
      contents: [
        {
          uri: 'azure://iterations/current',
          mimeType: 'application/json',
          text: JSON.stringify({ message: 'No current iteration found' }, null, 2)
        }
      ]
    };
  }

  const workItems = await client.iterations.getWorkItems(currentIteration.id);

  const result = {
    ...currentIteration,
    workItems
  };

  return {
    contents: [
      {
        uri: 'azure://iterations/current',
        mimeType: 'application/json',
        text: JSON.stringify(result, null, 2)
      }
    ]
  };
}

async function getIterationCapacityResource(client: AzureDevOpsClient, iterationId: string) {
  const capacity = await client.iterations.getCapacity(iterationId);

  return {
    contents: [
      {
        uri: `azure://iterations/${iterationId}/capacity`,
        mimeType: 'application/json',
        text: JSON.stringify(capacity, null, 2)
      }
    ]
  };
}

export function registerResources(server: Server, client: AzureDevOpsClient): void {
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: 'azure://work-items/my-tasks',
          name: 'My Tasks',
          description: 'Tasks atribuídas a mim que não estão concluídas',
          mimeType: 'application/json'
        },
        {
          uri: 'azure://work-items/bugs',
          name: 'All Bugs',
          description: 'Todos os bugs não concluídos do projeto',
          mimeType: 'application/json'
        },
        {
          uri: 'azure://work-items/all',
          name: 'All Work Items',
          description: 'Todos work items do projeto (limitado a 200)',
          mimeType: 'application/json'
        },
        {
          uri: 'azure://project/info',
          name: 'Project Info',
          description: 'Informações sobre o servidor MCP e health do wrapper',
          mimeType: 'application/json'
        },
        {
          uri: 'azure://boards/list',
          name: 'Boards do Projeto',
          description: 'Lista de todos os boards do projeto',
          mimeType: 'application/json'
        },
        {
          uri: 'azure://boards/{id}/config',
          name: 'Configuração de Board',
          description: 'Configuração detalhada de um board específico (substitua {id} pelo ID do board)',
          mimeType: 'application/json'
        },
        {
          uri: 'azure://iterations/all',
          name: 'All Iterations',
          description: 'Todas as iterations (sprints) do time - past, current, future',
          mimeType: 'application/json'
        },
        {
          uri: 'azure://iterations/current',
          name: 'Current Iteration',
          description: 'Sprint/iteration atual ativa com work items',
          mimeType: 'application/json'
        },
        {
          uri: 'azure://iterations/{id}/capacity',
          name: 'Iteration Capacity',
          description: 'Capacity planning de uma iteration específica (substitua {id} pelo ID da iteration)',
          mimeType: 'application/json'
        },
        {
          uri: 'azure://pullrequests/active',
          name: 'Active Pull Requests',
          description: 'Pull Requests ativos (backend implementado, handler pendente)',
          mimeType: 'application/json'
        },
        {
          uri: 'azure://teams/list',
          name: 'Teams do Projeto',
          description: 'Lista de todos os teams (backend implementado, handler pendente)',
          mimeType: 'application/json'
        },
        {
          uri: 'azure://wikis/list',
          name: 'Wikis do Projeto',
          description: 'Lista de todas as wikis disponíveis',
          mimeType: 'application/json'
        }
      ]
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;

    try {
      switch (uri) {
        case 'azure://work-items/my-tasks':
          return await getMyTasksResource(client);

        case 'azure://work-items/bugs':
          return await getBugsResource(client);

        case 'azure://work-items/all':
          return await getAllWorkItemsResource(client);

        case 'azure://project/info':
          return await getProjectInfoResource(client);

        case 'azure://boards/list':
          return await getBoardsListResource(client);

        case 'azure://iterations/all':
          return await getAllIterationsResource(client);

        case 'azure://iterations/current':
          return await getCurrentIterationResource(client);

        case 'azure://wikis/list':
          const wikis = await client.wiki.listWikis();
          return {
            contents: [{
              uri: 'azure://wikis/list',
              mimeType: 'application/json',
              text: JSON.stringify(wikis, null, 2)
            }]
          };

        default:
          if (uri.match(/^azure:\/\/boards\/([^\/]+)\/config$/)) {
            const boardId = uri.split('/')[3];
            return await getBoardConfigResource(client, boardId);
          }
          if (uri.match(/^azure:\/\/iterations\/([^\/]+)\/capacity$/)) {
            const iterationId = uri.split('/')[3];
            return await getIterationCapacityResource(client, iterationId);
          }
          throw new Error(`Unknown resource URI: ${uri}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        contents: [
          {
            uri,
            mimeType: 'text/plain',
            text: `Error accessing resource: ${errorMessage}`
          }
        ]
      };
    }
  });
}

