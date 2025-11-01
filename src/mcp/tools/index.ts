import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { AzureDevOpsClient } from '../../wrapper/index.js';
import {
  createWorkItemSchema,
  updateWorkItemSchema,
  deleteWorkItemSchema,
  getWorkItemSchema,
  queryWorkItemsSchema,
  getMyTasksSchema,
  getCriticalBugsSchema
} from '../schemas/index.js';

async function handleCreateWorkItem(client: AzureDevOpsClient, args: any) {
  try {
    const { type, title, description, acceptanceCriteria, reproSteps, assignedTo, priority, storyPoints, tags, state } = args;

    const fields: any = {
      'System.Title': title
    };

    if (description) fields['System.Description'] = description;
    if (acceptanceCriteria) fields['Microsoft.VSTS.Common.AcceptanceCriteria'] = acceptanceCriteria;
    if (reproSteps) fields['Microsoft.VSTS.TCM.ReproSteps'] = reproSteps;
    if (assignedTo) fields['System.AssignedTo'] = assignedTo;
    if (priority) fields['Microsoft.VSTS.Common.Priority'] = priority;
    if (storyPoints) fields['Microsoft.VSTS.Common.StoryPoints'] = storyPoints;
    if (tags) fields['System.Tags'] = tags;
    if (state) fields['System.State'] = state;

    const workItem = await client.workItems.create(type, fields);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Work item criado com sucesso!\n\n📋 ID: ${workItem.id}\n📝 Tipo: ${type}\n🔗 Título: ${title}\n⏰ Estado: ${workItem.fields['System.State'] || 'N/A'}`
        }
      ]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `❌ Erro ao criar work item: ${errorMessage}\n\nVerifique:\n1. PAT tem permissão de Write\n2. Tipo '${args.type}' existe no projeto\n3. Campos obrigatórios preenchidos\n4. Estados são válidos para o process template`
        }
      ],
      isError: true
    };
  }
}

async function handleUpdateWorkItem(client: AzureDevOpsClient, args: any) {
  try {
    const { id, state, assignedTo, description, acceptanceCriteria, reproSteps, title, priority, storyPoints } = args;

    const operations: any[] = [];

    if (state) operations.push({ op: 'add', path: '/fields/System.State', value: state });
    if (assignedTo) operations.push({ op: 'add', path: '/fields/System.AssignedTo', value: assignedTo });
    if (description) operations.push({ op: 'add', path: '/fields/System.Description', value: description });
    if (acceptanceCriteria) operations.push({ op: 'add', path: '/fields/Microsoft.VSTS.Common.AcceptanceCriteria', value: acceptanceCriteria });
    if (reproSteps) operations.push({ op: 'add', path: '/fields/Microsoft.VSTS.TCM.ReproSteps', value: reproSteps });
    if (title) operations.push({ op: 'add', path: '/fields/System.Title', value: title });
    if (priority) operations.push({ op: 'add', path: '/fields/Microsoft.VSTS.Common.Priority', value: priority });
    if (storyPoints) operations.push({ op: 'add', path: '/fields/Microsoft.VSTS.Common.StoryPoints', value: storyPoints });

    const workItem = await client.workItems.update(id, operations);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Work item #${id} atualizado com sucesso!\n\n📝 Título: ${workItem.fields['System.Title']}\n⏰ Estado: ${workItem.fields['System.State']}`
        }
      ]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `❌ Erro ao atualizar work item #${args.id}: ${errorMessage}\n\nVerifique:\n1. Work item existe\n2. PAT tem permissões\n3. Campos e estados são válidos`
        }
      ],
      isError: true
    };
  }
}

async function handleDeleteWorkItem(client: AzureDevOpsClient, args: any) {
  try {
    await client.workItems.delete(args.id);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Work item #${args.id} deletado com sucesso!`
        }
      ]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `❌ Erro ao deletar work item #${args.id}: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}

async function handleGetWorkItem(client: AzureDevOpsClient, args: any) {
  try {
    const workItem = await client.workItems.get(args.id, args.fields);

    return {
      content: [
        {
          type: 'text',
          text: `📋 Work Item #${workItem.id}\n\n` +
            `📝 Título: ${workItem.fields['System.Title']}\n` +
            `📌 Tipo: ${workItem.fields['System.WorkItemType']}\n` +
            `⏰ Estado: ${workItem.fields['System.State']}\n` +
            `👤 Atribuído: ${workItem.fields['System.AssignedTo'] || 'Não atribuído'}\n` +
            `🔥 Prioridade: ${workItem.fields['Microsoft.VSTS.Common.Priority'] || 'N/A'}\n\n` +
            `📄 Descrição:\n${workItem.fields['System.Description'] || 'Sem descrição'}`
        }
      ]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `❌ Erro ao buscar work item #${args.id}: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}

async function handleQueryWorkItems(client: AzureDevOpsClient, args: any) {
  try {
    const { query, fetchDetails = true, limit = 50 } = args;

    let items;
    if (fetchDetails) {
      items = await client.wiql.queryAndGet(query, args.fields || [], { top: limit });
    } else {
      const result = await client.wiql.query(query, { top: limit });
      items = result.workItems.slice(0, limit);
    }

    const count = items.length;
    const summary = items.map((item: any) =>
      fetchDetails
        ? `- #${item.id}: ${item.fields['System.Title']} (${item.fields['System.State']})`
        : `- #${item.id}`
    ).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `✅ Query executada com sucesso!\n\n📊 Resultados: ${count} work items\n\n${summary}`
        }
      ]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `❌ Erro ao executar query: ${errorMessage}\n\nVerifique:\n1. Sintaxe WIQL está correta\n2. Campos existem no projeto`
        }
      ],
      isError: true
    };
  }
}

async function handleGetMyTasks(client: AzureDevOpsClient, args: any) {
  try {
    const { state, includeCompleted = false, limit = 20 } = args;

    let query = `SELECT [System.Id], [System.Title], [System.State], [Microsoft.VSTS.Common.Priority]
FROM WorkItems
WHERE [System.AssignedTo] = @Me`;

    if (!includeCompleted) {
      query += ` AND [System.State] <> 'Done'`;
    }

    if (state) {
      query += ` AND [System.State] = '${state}'`;
    }

    query += ` ORDER BY [Microsoft.VSTS.Common.Priority]`;

    const items = await client.wiql.queryAndGet(query, ['System.Id', 'System.Title', 'System.State', 'Microsoft.VSTS.Common.Priority'], { top: limit });
    const count = items.length;

    if (count === 0) {
      return {
        content: [
          {
            type: 'text',
            text: '📭 Você não tem tasks pendentes!'
          }
        ]
      };
    }

    const summary = items.map((item: any) =>
      `- #${item.id}: ${item.fields['System.Title']} (${item.fields['System.State']}) - Prioridade ${item.fields['Microsoft.VSTS.Common.Priority'] || 'N/A'}`
    ).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `📋 Suas Tasks (${count})\n\n${summary}`
        }
      ]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `❌ Erro ao buscar suas tasks: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}

async function handleGetCriticalBugs(client: AzureDevOpsClient, args: any) {
  try {
    const { maxResults = 10 } = args;

    const query = `SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo]
FROM WorkItems
WHERE [System.WorkItemType] = 'Bug'
AND [Microsoft.VSTS.Common.Priority] = 1
AND [System.State] <> 'Done'
ORDER BY [System.CreatedDate] DESC`;

    const items = await client.wiql.queryAndGet(query, ['System.Id', 'System.Title', 'System.State', 'System.AssignedTo'], { top: maxResults });
    const count = items.length;

    if (count === 0) {
      return {
        content: [
          {
            type: 'text',
            text: '✅ Nenhum bug crítico aberto!'
          }
        ]
      };
    }

    const summary = items.map((item: any) =>
      `- #${item.id}: ${item.fields['System.Title']} (${item.fields['System.State']}) - ${item.fields['System.AssignedTo'] || 'Não atribuído'}`
    ).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `🔥 Bugs Críticos (Prioridade 1) - ${count} encontrados\n\n${summary}`
        }
      ]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `❌ Erro ao buscar bugs críticos: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}

async function handleListBoards(client: AzureDevOpsClient) {
  try {
    const boards = await client.boards.list();

    const text = `📋 **Boards do Projeto** (${boards.count} boards)\n\n${boards.value.map((b, i) => 
      `${i + 1}. **${b.name}**\n   - ID: ${b.id}\n   - Colunas: ${b.columns.length}\n   - URL: ${b.url}`
    ).join('\n\n')}`;

    return {
      content: [{ type: 'text', text }]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `❌ Erro ao listar boards: ${errorMessage}` }],
      isError: true
    };
  }
}

async function handleGetBoardConfig(client: AzureDevOpsClient, args: any) {
  try {
    const { boardId } = args;
    const board = await client.boards.get(boardId);

    const text = `📊 **Board: ${board.name}**\n\n**ID**: ${board.id}\n**URL**: ${board.url}\n\n**Colunas** (${board.columns.length}):\n${board.columns.map((c, i) => `${i + 1}. ${c.name} (${c.columnType})`).join('\n')}\n\n**Configurações**:\n- Reordenação de cards: ${board.settings.cardReordering ? 'Habilitada' : 'Desabilitada'}`;

    return {
      content: [{ type: 'text', text }]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `❌ Erro ao obter board: ${errorMessage}\n\nVerifique:\n1. Board ID está correto\n2. PAT tem permissões de leitura` }],
      isError: true
    };
  }
}

async function handleUpdateBoard(client: AzureDevOpsClient, args: any) {
  try {
    const { boardId, settings } = args;
    const board = await client.boards.updateSettings(boardId, settings);

    const text = `✅ **Board Atualizado**\n\nBoard "${board.name}" configurado com sucesso.\n\n**Mudanças aplicadas**:\n${settings.cardReordering !== undefined ? `- Reordenação de cards: ${settings.cardReordering ? 'Habilitada' : 'Desabilitada'}\n` : ''}${settings.backlogVisibilities ? '- Visibilidade de backlogs atualizada\n' : ''}`;

    return {
      content: [{ type: 'text', text }]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `❌ Erro ao atualizar board: ${errorMessage}\n\nVerifique:\n1. Board ID está correto\n2. PAT tem permissões de escrita\n3. Settings são válidas` }],
      isError: true
    };
  }
}

export function registerTools(server: Server, client: AzureDevOpsClient): void {
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'azure_create_work_item',
          description: 'Cria um novo work item no Azure DevOps (Task, Bug, User Story, Epic, Feature, Issue)',
          inputSchema: createWorkItemSchema
        },
        {
          name: 'azure_update_work_item',
          description: 'Atualiza um work item existente',
          inputSchema: updateWorkItemSchema
        },
        {
          name: 'azure_delete_work_item',
          description: 'Deleta um work item',
          inputSchema: deleteWorkItemSchema
        },
        {
          name: 'azure_get_work_item',
          description: 'Obtém detalhes de um work item específico',
          inputSchema: getWorkItemSchema
        },
        {
          name: 'azure_query_work_items',
          description: 'Executa uma query WIQL customizada sobre work items',
          inputSchema: queryWorkItemsSchema
        },
        {
          name: 'azure_get_my_tasks',
          description: 'Busca tasks atribuídas ao usuário atual (helper)',
          inputSchema: getMyTasksSchema
        },
        {
          name: 'azure_get_critical_bugs',
          description: 'Busca bugs críticos (prioridade 1) não concluídos',
          inputSchema: getCriticalBugsSchema
        },
        {
          name: 'azure_list_boards',
          description: 'Lista todos os boards do projeto',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        {
          name: 'azure_get_board_config',
          description: 'Obter configuração de board por ID',
          inputSchema: {
            type: 'object',
            properties: {
              boardId: { type: 'string', description: 'ID do board' }
            },
            required: ['boardId']
          }
        },
        {
          name: 'azure_update_board',
          description: 'Atualizar configurações de board',
          inputSchema: {
            type: 'object',
            properties: {
              boardId: { type: 'string', description: 'ID do board' },
              settings: {
                type: 'object',
                properties: {
                  cardReordering: { type: 'boolean', description: 'Habilitar reordenação de cards' },
                  backlogVisibilities: { type: 'object', description: 'Visibilidades de backlogs' }
                }
              }
            },
            required: ['boardId', 'settings']
          }
        }
      ]
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'azure_create_work_item':
        return await handleCreateWorkItem(client, args);

      case 'azure_update_work_item':
        return await handleUpdateWorkItem(client, args);

      case 'azure_delete_work_item':
        return await handleDeleteWorkItem(client, args);

      case 'azure_get_work_item':
        return await handleGetWorkItem(client, args);

      case 'azure_query_work_items':
        return await handleQueryWorkItems(client, args);

      case 'azure_get_my_tasks':
        return await handleGetMyTasks(client, args);

      case 'azure_get_critical_bugs':
        return await handleGetCriticalBugs(client, args);

      case 'azure_list_boards':
        return await handleListBoards(client);

      case 'azure_get_board_config':
        return await handleGetBoardConfig(client, args);

      case 'azure_update_board':
        return await handleUpdateBoard(client, args);

      default:
        return {
          content: [
            {
              type: 'text',
              text: `❌ Tool desconhecido: ${name}`
            }
          ],
          isError: true
        };
    }
  });
}

