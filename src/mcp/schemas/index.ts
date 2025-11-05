export const createWorkItemSchema = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: ['Task', 'Bug', 'User Story', 'Epic', 'Feature', 'Issue'],
      description: 'Tipo do work item (depende do process template do projeto)'
    },
    title: {
      type: 'string',
      minLength: 1,
      maxLength: 255,
      description: 'Título do work item (obrigatório, máx 255 caracteres)'
    },
    description: {
      type: 'string',
      description: 'Descrição detalhada em Markdown (formato automático)'
    },
    acceptanceCriteria: {
      type: 'string',
      description: 'Critérios de aceitação em Markdown (User Story) - formato automático'
    },
    reproSteps: {
      type: 'string',
      description: 'Passos para reproduzir em Markdown (Bug) - formato automático'
    },
    assignedTo: {
      type: 'string',
      format: 'email',
      description: 'Email do responsável (ex: usuario@empresa.com)'
    },
    priority: {
      type: 'number',
      minimum: 1,
      maximum: 4,
      description: 'Prioridade: 1 (highest) a 4 (lowest)'
    },
    storyPoints: {
      type: 'number',
      minimum: 0,
      description: 'Story points para estimativa'
    },
    tags: {
      type: 'string',
      description: 'Tags separadas por ponto-e-vírgula (ex: "urgent; bug; authentication")'
    },
    state: {
      type: 'string',
      description: 'Estado inicial (ex: To Do, New, etc - depende do template)'
    }
  },
  required: ['type', 'title']
};

export const updateWorkItemSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'number',
      description: 'ID do work item a atualizar'
    },
    state: {
      type: 'string',
      description: 'Novo estado (To Do, Doing, Done, etc)'
    },
    assignedTo: {
      type: 'string',
      format: 'email',
      description: 'Email do novo responsável'
    },
    description: {
      type: 'string',
      description: 'Nova descrição em Markdown (formato automático)'
    },
    acceptanceCriteria: {
      type: 'string',
      description: 'Novos critérios de aceitação em Markdown (formato automático)'
    },
    reproSteps: {
      type: 'string',
      description: 'Novos passos de reprodução em Markdown (formato automático)'
    },
    title: {
      type: 'string',
      description: 'Novo título'
    },
    priority: {
      type: 'number',
      minimum: 1,
      maximum: 4
    },
    storyPoints: {
      type: 'number',
      minimum: 0
    }
  },
  required: ['id']
};

export const deleteWorkItemSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'number',
      description: 'ID do work item a deletar'
    }
  },
  required: ['id']
};

export const getWorkItemSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'number',
      description: 'ID do work item'
    },
    fields: {
      type: 'array',
      items: { type: 'string' },
      description: 'Campos específicos a retornar (opcional)'
    }
  },
  required: ['id']
};

export const queryWorkItemsSchema = {
  type: 'object',
  properties: {
    query: {
      type: 'string',
      description: 'Query WIQL (ex: SELECT [System.Id] FROM WorkItems WHERE [System.State] = \'Active\')'
    },
    fetchDetails: {
      type: 'boolean',
      description: 'Se true, retorna work items completos. Se false, apenas IDs',
      default: true
    },
    fields: {
      type: 'array',
      items: { type: 'string' },
      description: 'Campos específicos (opcional)'
    },
    limit: {
      type: 'number',
      description: 'Máximo de resultados',
      default: 50,
      maximum: 200
    }
  },
  required: ['query']
};

export const getMyTasksSchema = {
  type: 'object',
  properties: {
    state: {
      type: 'string',
      description: 'Filtrar por estado específico (opcional)'
    },
    includeCompleted: {
      type: 'boolean',
      description: 'Incluir tasks concluídas',
      default: false
    },
    limit: {
      type: 'number',
      default: 20,
      maximum: 100
    }
  }
};

export const getCriticalBugsSchema = {
  type: 'object',
  properties: {
    maxResults: {
      type: 'number',
      default: 10,
      maximum: 50
    }
  }
};

export const listIterationsSchema = {
  type: 'object',
  properties: {
    team: {
      type: 'string',
      description: 'Team name (opcional, usa default team se não fornecido)'
    }
  }
};

export const getIterationSchema = {
  type: 'object',
  properties: {
    iterationId: {
      type: 'string',
      description: 'ID ou path da iteration'
    },
    team: {
      type: 'string',
      description: 'Team name (opcional)'
    }
  },
  required: ['iterationId']
};

export const createIterationSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      description: 'Nome da iteration/sprint (ex: Sprint 1)'
    },
    startDate: {
      type: 'string',
      description: 'Data de início em formato ISO 8601 (ex: 2025-11-01T00:00:00Z)'
    },
    finishDate: {
      type: 'string',
      description: 'Data de fim em formato ISO 8601 (ex: 2025-11-14T23:59:59Z)'
    },
    path: {
      type: 'string',
      description: 'Path da iteration (opcional)'
    },
    team: {
      type: 'string',
      description: 'Team name (opcional)'
    }
  },
  required: ['name', 'startDate', 'finishDate']
};

export const deleteIterationSchema = {
  type: 'object',
  properties: {
    iterationId: {
      type: 'string',
      description: 'ID da iteration a deletar'
    },
    team: {
      type: 'string',
      description: 'Team name (opcional)'
    }
  },
  required: ['iterationId']
};

export const listPullRequestsSchema = {
  type: 'object',
  properties: {
    repositoryId: {
      type: 'string',
      description: 'ID do repositório Git'
    },
    status: {
      type: 'string',
      enum: ['active', 'completed', 'abandoned'],
      description: 'Filtrar por status (opcional)'
    }
  },
  required: ['repositoryId']
};

export const createPullRequestSchema = {
  type: 'object',
  properties: {
    repositoryId: {
      type: 'string',
      description: 'ID do repositório Git'
    },
    sourceRefName: {
      type: 'string',
      description: 'Branch source (ex: refs/heads/feature-branch)'
    },
    targetRefName: {
      type: 'string',
      description: 'Branch target (ex: refs/heads/main)'
    },
    title: {
      type: 'string',
      description: 'Título do Pull Request'
    },
    description: {
      type: 'string',
      description: 'Descrição do PR (opcional)'
    }
  },
  required: ['repositoryId', 'sourceRefName', 'targetRefName', 'title']
};

export const listTeamsSchema = {
  type: 'object',
  properties: {},
  required: []
};

export const getTeamSchema = {
  type: 'object',
  properties: {
    teamId: {
      type: 'string',
      description: 'ID ou nome do team'
    }
  },
  required: ['teamId']
};

export const createTeamSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      description: 'Nome do team'
    },
    description: {
      type: 'string',
      description: 'Descrição do team (opcional)'
    }
  },
  required: ['name']
};

export const listRepositoriesSchema = {
  type: 'object',
  properties: {},
  required: []
};

export const getRepositorySchema = {
  type: 'object',
  properties: {
    repositoryId: {
      type: 'string',
      description: 'ID ou nome do repositório Git'
    }
  },
  required: ['repositoryId']
};

export const listWikisSchema = {
  type: 'object',
  properties: {},
  required: []
};

export const getWikiSchema = {
  type: 'object',
  properties: {
    wikiIdentifier: {
      type: 'string',
      description: 'Wiki ID ou nome'
    }
  },
  required: ['wikiIdentifier']
};

export const createWikiSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      description: 'Nome da wiki'
    },
    projectId: {
      type: 'string',
      description: 'ID do projeto'
    },
    type: {
      type: 'string',
      enum: ['projectWiki', 'codeWiki'],
      description: 'Tipo de wiki (padrão: projectWiki)'
    },
    repositoryId: {
      type: 'string',
      description: 'ID do repositório (obrigatório para codeWiki)'
    },
    mappedPath: {
      type: 'string',
      description: 'Path mapeado (opcional para codeWiki)'
    }
  },
  required: ['name', 'projectId']
};

export const listWikiPagesSchema = {
  type: 'object',
  properties: {
    wikiIdentifier: {
      type: 'string',
      description: 'Wiki ID ou nome'
    },
    path: {
      type: 'string',
      description: 'Path da página (opcional, para filtrar)'
    }
  },
  required: ['wikiIdentifier']
};

export const getWikiPageSchema = {
  type: 'object',
  properties: {
    wikiIdentifier: {
      type: 'string',
      description: 'Wiki ID ou nome'
    },
    path: {
      type: 'string',
      description: 'Path da página (ex: /Home)'
    },
    includeContent: {
      type: 'boolean',
      description: 'Incluir conteúdo markdown (padrão: true)'
    }
  },
  required: ['wikiIdentifier', 'path']
};

export const createWikiPageSchema = {
  type: 'object',
  properties: {
    wikiIdentifier: {
      type: 'string',
      description: 'Wiki ID ou nome'
    },
    path: {
      type: 'string',
      description: 'Path da página (ex: /Getting-Started)'
    },
    content: {
      type: 'string',
      description: 'Conteúdo markdown da página'
    }
  },
  required: ['wikiIdentifier', 'path', 'content']
};

export const updateWikiPageSchema = {
  type: 'object',
  properties: {
    wikiIdentifier: {
      type: 'string',
      description: 'Wiki ID ou nome'
    },
    path: {
      type: 'string',
      description: 'Path da página'
    },
    content: {
      type: 'string',
      description: 'Novo conteúdo markdown'
    }
  },
  required: ['wikiIdentifier', 'path', 'content']
};

