# Azure DevOps MCP Server

Servidor MCP (Model Context Protocol) para Azure DevOps que expõe Work Items, WIQL e Boards API como Resources e Tools, permitindo que agentes de IA interajam naturalmente com o Azure DevOps.

## Recursos

- **6 Resources** (dados read-only):
  - `azure://work-items/my-tasks` - Tasks atribuídas ao usuário
  - `azure://work-items/bugs` - Todos os bugs abertos
  - `azure://work-items/all` - Todos work items (max 200)
  - `azure://project/info` - Info do servidor e health
  - `azure://boards/list` - Lista de boards do projeto
  - `azure://boards/{id}/config` - Configuração de board específico

- **10 Tools** (ações executáveis):
  - `azure_create_work_item` - Criar task/bug/story
  - `azure_update_work_item` - Atualizar work item
  - `azure_delete_work_item` - Deletar work item
  - `azure_get_work_item` - Buscar por ID
  - `azure_query_work_items` - Executar query WIQL
  - `azure_get_my_tasks` - Helper para minhas tasks
  - `azure_get_critical_bugs` - Helper para bugs críticos
  - `azure_list_boards` - Listar boards do projeto
  - `azure_get_board_config` - Obter configuração de board
  - `azure_update_board` - Atualizar settings de board

## Instalação

```bash
cd /Users/cleberdasilvahensel/Desktop/source/ono-sendae/vibe-driven-development-kit/my_vibe/vibes/prototipos/mcp-azure-devops
npm install
npm run build
```

**Nota**: Usa CommonJS (não ESM) para compatibilidade com MCP SDK.

## Configuração

1. Copie `.env.example` para `.env`:
```bash
cp .env.example .env
```

2. Configure suas credenciais:
```env
AZURE_DEVOPS_PAT=seu_personal_access_token
AZURE_DEVOPS_ORG=sua_organizacao
AZURE_DEVOPS_PROJECT=seu_projeto
```

3. Adicione ao Cursor (`~/.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "azure-devops": {
      "command": "node",
      "args": [
        "/caminho/completo/para/mcp-azure-devops/dist/index.js"
      ],
      "env": {
        "AZURE_DEVOPS_PAT": "seu_pat",
        "AZURE_DEVOPS_ORG": "sua_org",
        "AZURE_DEVOPS_PROJECT": "seu_projeto"
      }
    }
  }
}
```

4. Reinicie o Cursor

## Uso com Agente

### Consultar Tasks

```
User: "Quais são minhas tasks pendentes?"

Agent: [Acessa azure://work-items/my-tasks]
Você tem 3 tasks:
- #456: Implementar JWT (To Do)
- #457: Corrigir parser (Doing)
- #789: Refatorar login (To Do)
```

### Criar Work Item

```
User: "Crie uma task para refatorar o componente de login"

Agent: [Chama azure_create_work_item]
✅ Task #790 criada com sucesso!
```

### Query WIQL

```
User: "Me mostre bugs críticos abertos"

Agent: [Chama azure_get_critical_bugs]
🔥 Bugs Críticos (2):
- #801: Login falha em iOS
- #802: Crash ao abrir perfil
```

## Arquitetura

```
MCP Server
├── Resources (4) - Dados read-only
├── Tools (7) - Ações executáveis
└── Wrapper Backend
    ├── Work Items API
    ├── WIQL API
    ├── Resilience (Retry, Circuit Breaker)
    ├── Rate Limiting
    └── Logging & Telemetry
```

## Desenvolvimento

```bash
npm run dev      # Modo desenvolvimento
npm run build    # Build para produção
npm run test     # Executar testes
npm run lint     # Linter
```

## Troubleshooting

### Server não inicia

- Verifique que todas variáveis de ambiente estão configuradas
- Confirme que PAT tem permissões corretas
- Valide que organização e projeto existem

### Work Item não é criado

- Verifique que tipo existe no processo template do projeto
- Confirme que estados são válidos
- Valide que PAT tem permissão de Write

### Query falha

- Valide sintaxe WIQL
- Confirme que campos existem no projeto
- Verifique limite de resultados

## Licença

MIT

