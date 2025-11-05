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
  getCriticalBugsSchema,
  listIterationsSchema,
  getIterationSchema,
  createIterationSchema,
  deleteIterationSchema,
  listPullRequestsSchema,
  createPullRequestSchema,
  listRepositoriesSchema,
  getRepositorySchema,
  listTeamsSchema,
  getTeamSchema,
  createTeamSchema,
  listWikisSchema,
  getWikiSchema,
  createWikiSchema,
  listWikiPagesSchema,
  getWikiPageSchema,
  createWikiPageSchema,
  updateWikiPageSchema
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

async function handleListIterations(client: AzureDevOpsClient, args: any) {
  try {
    const { team } = args;
    const iterations = await client.iterations.list(team);

    if (iterations.length === 0) {
      return {
        content: [{ type: 'text', text: '📭 Nenhuma iteration encontrada!' }]
      };
    }

    const text = `📅 **Iterations** (${iterations.length} sprints)\n\n${iterations.map((iter, i) => 
      `${i + 1}. **${iter.name}** (${iter.attributes.timeFrame})\n   - ID: ${iter.id}\n   - Início: ${iter.attributes.startDate.split('T')[0]}\n   - Fim: ${iter.attributes.finishDate.split('T')[0]}\n   - Path: ${iter.path}`
    ).join('\n\n')}`;

    return {
      content: [{ type: 'text', text }]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `❌ Erro ao listar iterations: ${errorMessage}` }],
      isError: true
    };
  }
}

async function handleCreateIteration(client: AzureDevOpsClient, args: any) {
  try {
    const { name, startDate, finishDate, path, team } = args;

    const start = new Date(startDate);
    const finish = new Date(finishDate);

    if (finish <= start) {
      return {
        content: [{ type: 'text', text: '❌ Erro: finishDate deve ser posterior a startDate' }],
        isError: true
      };
    }

    const iteration = await client.iterations.create({
      name,
      startDate,
      finishDate,
      path
    }, team);

    const text = `✅ **Iteration Criada**\n\n📅 Nome: ${iteration.name}\n🆔 ID: ${iteration.id}\n📍 Path: ${iteration.path}\n⏰ Período: ${iteration.attributes.startDate.split('T')[0]} → ${iteration.attributes.finishDate.split('T')[0]}`;

    return {
      content: [{ type: 'text', text }]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `❌ Erro ao criar iteration: ${errorMessage}\n\nNota: Create/Delete operations podem não ser suportadas via SDK. Use Azure DevOps portal ou HTTP provider.` }],
      isError: true
    };
  }
}

async function handleGetCurrentIteration(client: AzureDevOpsClient) {
  try {
    const iterations = await client.iterations.list();
    const current = iterations.find(iter => iter.attributes.timeFrame === 'current');

    if (!current) {
      return {
        content: [{ type: 'text', text: '📭 Nenhuma iteration ativa no momento!' }]
      };
    }

    const workItems = await client.iterations.getWorkItems(current.id);

    const text = `📅 **Iteration Atual**\n\n**Nome**: ${current.name}\n**ID**: ${current.id}\n**Path**: ${current.path}\n**Período**: ${current.attributes.startDate.split('T')[0]} → ${current.attributes.finishDate.split('T')[0]}\n\n**Work Items** (${workItems.workItemRelations.length}):\n${workItems.workItemRelations.map((rel, i) => `${i + 1}. #${rel.target.id}`).join('\n')}`;

    return {
      content: [{ type: 'text', text }]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `❌ Erro ao buscar iteration atual: ${errorMessage}` }],
      isError: true
    };
  }
}

async function handleDeleteIteration(client: AzureDevOpsClient, args: any) {
  try {
    const { iterationId, team } = args;
    await client.iterations.delete(iterationId, team);

    return {
      content: [{ type: 'text', text: `✅ Iteration ${iterationId} deletada com sucesso!\n\n⚠️ Esta ação remove a iteration do time. Work items não são deletados.` }]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `❌ Erro ao deletar iteration: ${errorMessage}\n\nNota: Delete operation pode não ser suportada via SDK. Use Azure DevOps portal.` }],
      isError: true
    };
  }
}

async function handleGetIterationCapacity(client: AzureDevOpsClient, args: any) {
  try {
    const { iterationId, team } = args;
    const capacity = await client.iterations.getCapacity(iterationId, team);

    if (capacity.length === 0) {
      return {
        content: [{ type: 'text', text: `📭 Nenhuma capacity definida para iteration ${iterationId}` }]
      };
    }

    const text = `📊 **Capacity Planning**\n\n**Iteration**: ${iterationId}\n\n${capacity.map((cap, i) => 
      `**Membro ${i + 1}**: ${cap.teamMemberDisplayName || cap.teamMemberId}\n${cap.activities.map(act => `   - ${act.name}: ${act.capacityPerDay}h/dia`).join('\n')}\n${cap.daysOff.length > 0 ? `   - Dias off: ${cap.daysOff.length}` : ''}`
    ).join('\n\n')}`;

    return {
      content: [{ type: 'text', text }]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `❌ Erro ao buscar capacity: ${errorMessage}\n\nNota: Capacity API pode não ser totalmente suportada via SDK. Use HTTP provider.` }],
      isError: true
    };
  }
}

async function handleListPullRequests(client: AzureDevOpsClient, args: any) {
  try {
    const { repositoryId, status } = args;
    const prs = await client.pullRequests.list(repositoryId, status);

    if (prs.value.length === 0) {
      return {
        content: [{ type: 'text', text: '📭 Nenhum Pull Request encontrado!' }]
      };
    }

    const text = `📋 **Pull Requests** (${prs.count})\n\n` + prs.value.map((pr, i) => 
      `${i + 1}. **#${pr.pullRequestId}** - ${pr.title}\n   👤 ${pr.createdBy.displayName}\n   🔀 ${pr.sourceRefName} → ${pr.targetRefName}\n   📊 Status: ${pr.status}`
    ).join('\n\n');

    return {
      content: [{ type: 'text', text }]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `❌ Erro ao listar PRs: ${errorMessage}` }],
      isError: true
    };
  }
}

async function handleCreatePullRequest(client: AzureDevOpsClient, args: any) {
  try {
    const { repositoryId, sourceRefName, targetRefName, title, description } = args;
    const pr = await client.pullRequests.create(repositoryId, {
      sourceRefName,
      targetRefName,
      title,
      description
    });

    const text = `✅ **Pull Request Criado**\n\n🆔 ID: #${pr.pullRequestId}\n📝 Título: ${pr.title}\n🔀 ${pr.sourceRefName} → ${pr.targetRefName}\n👤 Criado por: ${pr.createdBy.displayName}\n📊 Status: ${pr.status}`;

    return {
      content: [{ type: 'text', text }]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `❌ Erro ao criar PR: ${errorMessage}` }],
      isError: true
    };
  }
}

async function handleListTeams(client: AzureDevOpsClient) {
  try {
    const result = await client.teams.list();

    if (result.value.length === 0) {
      return {
        content: [{ type: 'text', text: '📭 Nenhum team encontrado!' }]
      };
    }

    const text = `👥 **Teams** (${result.count})\n\n` + result.value.map((team, i) => 
      `${i + 1}. **${team.name}**\n   🆔 ID: ${team.id}\n   📝 ${team.description || 'Sem descrição'}`
    ).join('\n\n');

    return {
      content: [{ type: 'text', text }]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `❌ Erro ao listar teams: ${errorMessage}` }],
      isError: true
    };
  }
}

async function handleGetTeam(client: AzureDevOpsClient, args: any) {
  try {
    const { teamId } = args;
    const team = await client.teams.get(teamId);

    const members = await client.teams.listMembers(teamId);

    const text = `👥 **Team Details**\n\n**Nome**: ${team.name}\n**ID**: ${team.id}\n**Descrição**: ${team.description || 'N/A'}\n\n**Membros** (${members.count}):\n${members.value.map((m, i) => `${i + 1}. ${m.identity.displayName}`).join('\n')}`;

    return {
      content: [{ type: 'text', text }]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `❌ Erro ao buscar team: ${errorMessage}` }],
      isError: true
    };
  }
}

async function handleCreateTeam(client: AzureDevOpsClient, args: any) {
  try {
    const { name, description } = args;
    const team = await client.teams.create({ name, description });

    const text = `✅ **Team Criado**\n\n👥 Nome: ${team.name}\n🆔 ID: ${team.id}\n📝 Descrição: ${team.description || 'N/A'}`;

    return {
      content: [{ type: 'text', text }]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `❌ Erro ao criar team: ${errorMessage}` }],
      isError: true
    };
  }
}

async function handleListRepositories(client: AzureDevOpsClient) {
  try {
    const result = await client.repositories.list();

    if (result.value.length === 0) {
      return {
        content: [{ type: 'text', text: '📭 Nenhum repositório Git encontrado no projeto!' }]
      };
    }

    const text = `📦 **Repositórios Git** (${result.count})\n\n` + result.value.map((repo, i) => 
      `${i + 1}. **${repo.name}**\n   🆔 ID: ${repo.id}\n   🌿 Branch padrão: ${repo.defaultBranch || 'N/A'}\n   🔗 ${repo.remoteUrl || repo.url}`
    ).join('\n\n');

    return {
      content: [{ type: 'text', text }]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `❌ Erro ao listar repositórios: ${errorMessage}` }],
      isError: true
    };
  }
}

async function handleGetRepository(client: AzureDevOpsClient, args: any) {
  try {
    const { repositoryId } = args;
    const repo = await client.repositories.get(repositoryId);

    const text = `📦 **Repositório Git**\n\n**Nome**: ${repo.name}\n**ID**: ${repo.id}\n**Projeto**: ${repo.project?.name || 'N/A'}\n**Branch Padrão**: ${repo.defaultBranch || 'N/A'}\n**URL**: ${repo.remoteUrl || repo.url}\n**SSH URL**: ${repo.sshUrl || 'N/A'}`;

    return {
      content: [{ type: 'text', text }]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `❌ Erro ao buscar repositório: ${errorMessage}` }],
      isError: true
    };
  }
}

async function handleListWikis(client: AzureDevOpsClient) {
  try {
    const result = await client.wiki.listWikis();
    
    if (result.count === 0) {
      return { content: [{ type: 'text', text: '📭 Nenhuma wiki encontrada!' }] };
    }

    const text = `📚 **Wikis** (${result.count})\n\n` +
      result.value.map((w, i) => `${i + 1}. **${w.name}**\n   🆔 ID: ${w.id}\n   📁 Tipo: ${w.type}\n   🔗 ${w.url}`).join('\n\n');

    return { content: [{ type: 'text', text }] };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { content: [{ type: 'text', text: `❌ Erro ao listar wikis: ${errorMessage}` }], isError: true };
  }
}

async function handleGetWiki(client: AzureDevOpsClient, args: any) {
  try {
    const { wikiIdentifier } = args;
    const wiki = await client.wiki.getWiki(wikiIdentifier);

    const text = `📚 **Wiki**\n\n**Nome**: ${wiki.name}\n**ID**: ${wiki.id}\n**Tipo**: ${wiki.type}\n**Projeto**: ${wiki.projectId}\n**Repositório**: ${wiki.repositoryId}\n**URL**: ${wiki.url}`;

    return { content: [{ type: 'text', text }] };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { content: [{ type: 'text', text: `❌ Erro ao buscar wiki: ${errorMessage}` }], isError: true };
  }
}

async function handleCreateWiki(client: AzureDevOpsClient, args: any) {
  try {
    const wiki = await client.wiki.createWiki(args);
    return { content: [{ type: 'text', text: `✅ Wiki criada com sucesso!\n\n📚 ID: ${wiki.id}\n📝 Nome: ${wiki.name}\n🔗 ${wiki.url}` }] };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { content: [{ type: 'text', text: `❌ Erro ao criar wiki: ${errorMessage}` }], isError: true };
  }
}

async function handleListWikiPages(client: AzureDevOpsClient, args: any) {
  try {
    const { wikiIdentifier, path } = args;
    const result = await client.wiki.listPages(wikiIdentifier, path);
    
    if (result.count === 0) {
      return { content: [{ type: 'text', text: '📭 Nenhuma página encontrada!' }] };
    }

    const text = `📄 **Páginas** (${result.count})\n\n` +
      result.value.map((p, i) => `${i + 1}. **${p.path}**\n   🆔 ID: ${p.id}\n   📁 Order: ${p.order}`).join('\n\n');

    return { content: [{ type: 'text', text }] };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { content: [{ type: 'text', text: `❌ Erro ao listar páginas: ${errorMessage}` }], isError: true };
  }
}

async function handleGetWikiPage(client: AzureDevOpsClient, args: any) {
  try {
    const { wikiIdentifier, path, includeContent } = args;
    const page = await client.wiki.getPage(wikiIdentifier, path, includeContent);

    const text = `📄 **Página**\n\n**Path**: ${page.path}\n**ID**: ${page.id}\n**Git Path**: ${page.gitItemPath}\n\n${page.content ? `**Content**:\n\`\`\`markdown\n${page.content}\n\`\`\`` : ''}`;

    return { content: [{ type: 'text', text }] };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { content: [{ type: 'text', text: `❌ Erro ao buscar página: ${errorMessage}` }], isError: true };
  }
}

async function handleCreateWikiPage(client: AzureDevOpsClient, args: any) {
  try {
    const { wikiIdentifier, path, content } = args;
    const page = await client.wiki.createPage(wikiIdentifier, path, { content });
    return { content: [{ type: 'text', text: `✅ Página criada com sucesso!\n\n📄 Path: ${page.path}\n🆔 ID: ${page.id}` }] };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { content: [{ type: 'text', text: `❌ Erro ao criar página: ${errorMessage}` }], isError: true };
  }
}

async function handleUpdateWikiPage(client: AzureDevOpsClient, args: any) {
  try {
    const { wikiIdentifier, path, content } = args;
    const page = await client.wiki.updatePage(wikiIdentifier, path, { content });
    return { content: [{ type: 'text', text: `✅ Página atualizada com sucesso!\n\n📄 Path: ${page.path}\n🆔 ID: ${page.id}` }] };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { content: [{ type: 'text', text: `❌ Erro ao atualizar página: ${errorMessage}` }], isError: true };
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
        },
        {
          name: 'azure_list_iterations',
          description: 'Lista todas as iterations (sprints) do time',
          inputSchema: listIterationsSchema
        },
        {
          name: 'azure_create_iteration',
          description: 'Cria uma nova iteration/sprint',
          inputSchema: createIterationSchema
        },
        {
          name: 'azure_get_current_iteration',
          description: 'Obtém a iteration/sprint atual ativa com work items',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        {
          name: 'azure_delete_iteration',
          description: 'Deleta uma iteration (WARNING: use com cautela)',
          inputSchema: deleteIterationSchema
        },
        {
          name: 'azure_get_iteration_capacity',
          description: 'Obtém capacity planning de uma iteration',
          inputSchema: getIterationSchema
        },
        {
          name: 'azure_list_pull_requests',
          description: 'Lista Pull Requests de um repositório',
          inputSchema: listPullRequestsSchema
        },
        {
          name: 'azure_create_pull_request',
          description: 'Cria um novo Pull Request',
          inputSchema: createPullRequestSchema
        },
        {
          name: 'azure_list_teams',
          description: 'Lista todos os teams do projeto',
          inputSchema: listTeamsSchema
        },
        {
          name: 'azure_get_team',
          description: 'Obtém detalhes de um team específico',
          inputSchema: getTeamSchema
        },
        {
          name: 'azure_create_team',
          description: 'Cria um novo team no projeto',
          inputSchema: createTeamSchema
        },
        {
          name: 'azure_list_repositories',
          description: 'Lista todos os repositórios Git do projeto',
          inputSchema: listRepositoriesSchema
        },
        {
          name: 'azure_get_repository',
          description: 'Obtém detalhes de um repositório Git específico',
          inputSchema: getRepositorySchema
        },
        {
          name: 'azure_list_wikis',
          description: 'Lista todas as wikis do projeto',
          inputSchema: listWikisSchema
        },
        {
          name: 'azure_get_wiki',
          description: 'Obtém detalhes de uma wiki específica',
          inputSchema: getWikiSchema
        },
        {
          name: 'azure_create_wiki',
          description: 'Cria uma nova wiki no projeto',
          inputSchema: createWikiSchema
        },
        {
          name: 'azure_list_wiki_pages',
          description: 'Lista páginas de uma wiki',
          inputSchema: listWikiPagesSchema
        },
        {
          name: 'azure_get_wiki_page',
          description: 'Obtém uma página específica da wiki',
          inputSchema: getWikiPageSchema
        },
        {
          name: 'azure_create_wiki_page',
          description: 'Cria uma nova página na wiki',
          inputSchema: createWikiPageSchema
        },
        {
          name: 'azure_update_wiki_page',
          description: 'Atualiza uma página existente na wiki',
          inputSchema: updateWikiPageSchema
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

      case 'azure_list_iterations':
        return await handleListIterations(client, args);

      case 'azure_create_iteration':
        return await handleCreateIteration(client, args);

      case 'azure_get_current_iteration':
        return await handleGetCurrentIteration(client);

      case 'azure_delete_iteration':
        return await handleDeleteIteration(client, args);

      case 'azure_get_iteration_capacity':
        return await handleGetIterationCapacity(client, args);

      case 'azure_list_pull_requests':
        return await handleListPullRequests(client, args);

      case 'azure_create_pull_request':
        return await handleCreatePullRequest(client, args);

      case 'azure_list_teams':
        return await handleListTeams(client);

      case 'azure_get_team':
        return await handleGetTeam(client, args);

      case 'azure_create_team':
        return await handleCreateTeam(client, args);

      case 'azure_list_repositories':
        return await handleListRepositories(client);

      case 'azure_get_repository':
        return await handleGetRepository(client, args);

      case 'azure_list_wikis':
        return await handleListWikis(client);

      case 'azure_get_wiki':
        return await handleGetWiki(client, args);

      case 'azure_create_wiki':
        return await handleCreateWiki(client, args);

      case 'azure_list_wiki_pages':
        return await handleListWikiPages(client, args);

      case 'azure_get_wiki_page':
        return await handleGetWikiPage(client, args);

      case 'azure_create_wiki_page':
        return await handleCreateWikiPage(client, args);

      case 'azure_update_wiki_page':
        return await handleUpdateWikiPage(client, args);

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

