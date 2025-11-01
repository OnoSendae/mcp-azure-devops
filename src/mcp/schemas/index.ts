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

