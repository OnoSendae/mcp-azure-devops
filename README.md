# Azure DevOps MCP Server

<div align="center">

**Servidor MCP que permite que agentes de IA interajam naturalmente com o Azure DevOps**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-%3E%3D18-green.svg)](https://nodejs.org/)

[Instalação](#instalação) • [Recursos](#recursos) • [Configuração](#configuração) • [Exemplos](#exemplos-de-uso) • [Permissões](#permissões-do-azure-devops)

</div>

---

## 📖 O Que É Este Projeto?

Este é um **servidor MCP (Model Context Protocol)** que conecta agentes de IA (como Claude, ChatGPT via Cursor) ao **Azure DevOps**, permitindo que você converse em linguagem natural para:

- ✅ Consultar e criar Work Items (Tasks, Bugs, User Stories)
- ✅ Executar queries WIQL personalizadas
- ✅ Gerenciar Sprints (Iterations) e Boards
- ✅ Criar e revisar Pull Requests
- ✅ Gerenciar Teams e Repositories
- ✅ Editar Wiki Pages

**Em vez de:**
```
Abrir browser → Login Azure DevOps → Boards → New Work Item → Preencher formulário...
```

**Você faz:**
```
User: "Crie uma task para implementar autenticação JWT com prioridade alta"
Agent: ✅ Task #456 criada com sucesso!
```

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         CURSOR / AI AGENT                        │
│                    (Claude, ChatGPT, etc)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Model Context Protocol (MCP)
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      MCP SERVER (este projeto)                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  MCP Layer                                                │   │
│  │  ├─ 12 Resources (read-only data sources)                │   │
│  │  └─ 27 Tools (executable actions)                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Business Logic Layer                                     │   │
│  │  ├─ Work Items API      ├─ Pull Requests API            │   │
│  │  ├─ WIQL API            ├─ Teams API                     │   │
│  │  ├─ Boards API          ├─ Repositories API             │   │
│  │  ├─ Iterations API      └─ Wikis API                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Core Infrastructure                                      │   │
│  │  ├─ Retry Policy (exponential backoff)                   │   │
│  │  ├─ Circuit Breaker (failure protection)                 │   │
│  │  ├─ Rate Limiter (token bucket)                          │   │
│  │  ├─ Logger (with credential redaction)                   │   │
│  │  └─ Telemetry (performance metrics)                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Providers Layer                                          │   │
│  │  ├─ HTTP Provider (axios + REST API)                     │   │
│  │  └─ SDK Provider (azure-devops-node-api)                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS + Personal Access Token (PAT)
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      AZURE DEVOPS REST API                       │
│         https://dev.azure.com/{organization}/{project}           │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📁 Estrutura de Pastas

```
mcp-azure-devops/
├── src/                          # Código-fonte TypeScript
│   ├── index.ts                  # Entry point (inicialização do servidor)
│   ├── server.ts                 # Configuração do MCP Server
│   │
│   ├── mcp/                      # MCP Layer
│   │   ├── resources/            # 12 Resources (data sources)
│   │   │   └── index.ts          # Handlers de resources
│   │   ├── tools/                # 27 Tools (actions)
│   │   │   └── index.ts          # Handlers de tools
│   │   └── schemas/              # JSON Schemas de validação
│   │       └── index.ts          # Schemas dos tools
│   │
│   └── wrapper/                  # Backend Wrapper
│       ├── index.ts              # Client principal
│       │
│       ├── config/               # Configuração
│       │   ├── env.ts            # Leitura de variáveis de ambiente
│       │   └── index.ts          # Config object (frozen)
│       │
│       ├── core/                 # Core Infrastructure
│       │   ├── auth.ts           # Authentication Manager
│       │   ├── resilience.ts     # Retry Policy + Circuit Breaker
│       │   └── rules.ts          # Rate Limiter + Validation
│       │
│       ├── logging/              # Logging & Telemetry
│       │   ├── logger.ts         # Logger (pino + redaction)
│       │   └── telemetry.ts     # Performance metrics
│       │
│       ├── providers/            # Providers Layer
│       │   ├── base.provider.ts  # Interface abstrata
│       │   ├── http.provider.ts  # HTTP Client (axios)
│       │   ├── sdk.provider.ts   # SDK Client (oficial)
│       │   └── index.ts          # Factory
│       │
│       ├── api/                  # Business Logic APIs
│       │   ├── work-items.ts     # Work Items CRUD + WIQL
│       │   ├── wiql.ts           # WIQL Queries
│       │   ├── boards.ts         # Boards Management
│       │   ├── iterations.ts     # Iterations/Sprints
│       │   ├── pull-requests.ts  # Pull Requests
│       │   ├── repositories.ts   # Git Repositories
│       │   ├── teams.ts          # Teams Management
│       │   └── wiki.ts           # Wiki Pages
│       │
│       └── types/                # TypeScript Types
│           ├── index.ts          # Exports
│           ├── work-items.ts     # Work Item types
│           ├── boards.ts         # Board types
│           ├── iterations.ts     # Iteration types
│           ├── pull-requests.ts  # PR types
│           ├── teams.ts          # Team types
│           ├── wiki.ts           # Wiki types
│           └── providers.ts      # Provider types
│
├── dist/                         # JavaScript compilado (gerado)
├── tests/                        # Testes
│   ├── integration/              # Testes de integração
│   └── mcp/                      # Testes MCP
│
├── docs/                         # Documentação adicional
│
├── package.json                  # Dependências e scripts
├── tsconfig.json                 # Configuração TypeScript
├── .gitignore                    # Arquivos ignorados
├── cursor-mcp-config-example.json # Exemplo de config
├── README.md                     # Este arquivo
├── QUICKSTART.md                 # Guia rápido
├── ARCHITECTURE.md               # Arquitetura detalhada
└── LICENSE                       # Licença MIT
```

---

## 🚀 Instalação

### Pré-requisitos

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- Conta no **Azure DevOps**
- **Personal Access Token (PAT)** com permissões apropriadas
- **Cursor** (ou outro cliente MCP)

### Passo 1: Clone o Repositório

```bash
git clone https://github.com/seu-usuario/mcp-azure-devops.git
cd mcp-azure-devops
```

### Passo 2: Instale as Dependências

```bash
npm install
```

**Dependências principais:**
- `@modelcontextprotocol/sdk` - SDK oficial do MCP
- `azure-devops-node-api` - SDK oficial do Azure DevOps
- `axios` - HTTP client
- `pino` - Logger profissional
- `dotenv` - Gerenciamento de variáveis de ambiente

### Passo 3: Compile o Projeto

```bash
npm run build
```

Isso irá:
1. Compilar TypeScript → JavaScript
2. Gerar pasta `dist/` com código compilado
3. Gerar source maps e type definitions

### Passo 4: Verifique a Instalação

```bash
ls dist/
# Deve mostrar: index.js, server.js, mcp/, wrapper/, etc
```

---

## ⚙️ Configuração

### Passo 1: Crie um Personal Access Token (PAT)

1. Acesse Azure DevOps: `https://dev.azure.com/{sua-org}`
2. Clique em **User Settings** (ícone de usuário) → **Personal Access Tokens**
3. Clique em **New Token**
4. Configure:
   - **Name**: `MCP Server Token`
   - **Organization**: Sua organização
   - **Expiration**: 90 dias (ou custom)
   - **Scopes**: Ver seção [Permissões](#permissões-do-azure-devops)

5. Clique em **Create** e **copie o token** (não será mostrado novamente!)

### Passo 2: Configure o Cursor

Edite o arquivo de configuração do Cursor:

**macOS/Linux:** `~/.cursor/mcp.json`  
**Windows:** `%USERPROFILE%\.cursor\mcp.json`

```json
{
  "mcpServers": {
    "azure-devops": {
      "command": "node",
      "args": [
        "/caminho/completo/para/mcp-azure-devops/dist/index.js"
      ],
      "env": {
        "AZURE_DEVOPS_PAT": "seu_personal_access_token_aqui",
        "AZURE_DEVOPS_ORG": "sua_organizacao",
        "AZURE_DEVOPS_PROJECT": "seu_projeto",
        "LOG_LEVEL": "info",
        "NODE_ENV": "production"
      }
    }
  }
}
```

**⚠️ IMPORTANTE:**
- Substitua `/caminho/completo/para/` pelo path absoluto do projeto
- Substitua `seu_personal_access_token_aqui` pelo PAT gerado
- Substitua `sua_organizacao` pelo nome da sua org no Azure DevOps
- Substitua `seu_projeto` pelo nome do projeto

**📌 Exemplo:**
```json
{
  "mcpServers": {
    "azure-devops": {
      "command": "node",
      "args": [
        "/home/usuario/projetos/mcp-azure-devops/dist/index.js"
      ],
      "env": {
        "AZURE_DEVOPS_PAT": "abc123xyz789...",
        "AZURE_DEVOPS_ORG": "minha-empresa",
        "AZURE_DEVOPS_PROJECT": "Projeto-Principal"
      }
    }
  }
}
```

### Passo 3: Reinicie o Cursor

Feche completamente o Cursor e reabra.

### Passo 4: Teste a Conexão

No Cursor, pergunte ao agente:

```
"Quais são minhas tasks pendentes no Azure DevOps?"
```

Se tudo estiver correto, o agente irá acessar o resource `azure://work-items/my-tasks` e listar suas tasks!

---

## 📦 Recursos (Resources)

Resources são **fontes de dados read-only** que o agente pode consultar. Funcionam como "páginas web" que o agente acessa para obter informações.

| URI | Descrição | Retorna | Limite |
|-----|-----------|---------|--------|
| `azure://work-items/my-tasks` | Tasks atribuídas ao usuário atual | Work Items onde `AssignedTo = @Me` e `State != Done` | 50 itens |
| `azure://work-items/bugs` | Todos os bugs abertos do projeto | Work Items onde `WorkItemType = Bug` e `State != Done` | 100 itens |
| `azure://work-items/all` | Todos os work items (recentes) | Todos os Work Items ordenados por data de modificação | 200 itens |
| `azure://project/info` | Health do servidor e informações do projeto | Status de conexão, circuit breaker, rate limit, provider ativo | - |
| `azure://boards/list` | Lista de boards do projeto | Todos os boards com ID, nome e URL | - |
| `azure://boards/{id}/config` | Configuração de um board específico | Colunas, settings, visibilidade de backlog | - |
| `azure://iterations/all` | Todas as iterations (sprints) | Iterations passadas, atual e futuras | - |
| `azure://iterations/current` | Sprint atual com work items | Iteration atual + lista de work items da sprint | - |
| `azure://iterations/{id}/capacity` | Capacity planning de uma iteration | Capacidade por usuário, atividade e time | - |
| `azure://pullrequests/active` | Pull Requests ativos | PRs com status `active` (não completed/abandoned) | - |
| `azure://teams/list` | Teams do projeto | Todos os teams com ID, nome, descrição | - |
| `azure://wikis/list` | Wikis do projeto | Todas as wikis com ID, nome, tipo (project/code) | - |

**💡 Como o agente usa:**
```
User: "Quais são os bugs críticos abertos?"

Agent:
1. Acessa resource: azure://work-items/bugs
2. Filtra por prioridade crítica
3. Retorna: "🔥 Encontrei 3 bugs críticos: #123, #456, #789"
```

---

## 🛠️ Tools (Ações Executáveis)

Tools são **ações que modificam dados** no Azure DevOps. O agente as executa quando você pede para criar, atualizar ou deletar algo.

### 📋 Work Items (7 tools)

| Tool | Descrição | Permissão Necessária | Alertas |
|------|-----------|----------------------|---------|
| `azure_create_work_item` | Cria um novo work item (Task, Bug, User Story, etc) | ✅ Work Items: **Read & Write** | ⚠️ Cria no projeto configurado. Tipo deve existir no process template. |
| `azure_update_work_item` | Atualiza campos de um work item existente | ✅ Work Items: **Read & Write** | ⚠️ Estados devem ser válidos para o workflow. |
| `azure_delete_work_item` | Deleta um work item (move para Recycle Bin) | ✅ Work Items: **Read & Write** | 🔴 **CRÍTICO**: Ação irreversível (pode recuperar da lixeira em 30 dias). |
| `azure_get_work_item` | Busca um work item por ID | ✅ Work Items: **Read** | - |
| `azure_query_work_items` | Executa query WIQL customizada | ✅ Work Items: **Read** | ⚠️ Limite de 20.000 resultados por query. Sintaxe WIQL deve ser válida. |
| `azure_get_my_tasks` | Busca tasks do usuário atual | ✅ Work Items: **Read** | - |
| `azure_get_critical_bugs` | Busca bugs com prioridade crítica | ✅ Work Items: **Read** | - |

**Exemplo de uso:**
```javascript
// Criação de task
User: "Crie uma task 'Implementar login JWT' com prioridade alta"
Agent: Chama azure_create_work_item({
  type: "Task",
  title: "Implementar login JWT",
  priority: 1
})
Result: ✅ Task #456 criada!
```

### 📊 Boards (3 tools)

| Tool | Descrição | Permissão Necessária | Alertas |
|------|-----------|----------------------|---------|
| `azure_list_boards` | Lista todos os boards do projeto | ✅ Work Items: **Read** | - |
| `azure_get_board_config` | Obtém configuração de um board | ✅ Work Items: **Read** | - |
| `azure_update_board` | Atualiza configuração de board | ✅ Work Items: **Read & Write** + **Project & Team: Read, Write & Manage** | ⚠️ Requer permissão de Project Admin. Alterações afetam todo o team. |

### 🏃 Iterations / Sprints (5 tools)

| Tool | Descrição | Permissão Necessária | Alertas |
|------|-----------|----------------------|---------|
| `azure_list_iterations` | Lista todas as iterations (sprints) | ✅ Work Items: **Read** | - |
| `azure_create_iteration` | Cria uma nova iteration/sprint | ✅ Work Items: **Read & Write** + **Project & Team: Read, Write & Manage** | ⚠️ Requer permissão de Team Admin. Datas devem ser futuras. |
| `azure_get_current_iteration` | Obtém sprint atual com work items | ✅ Work Items: **Read** | - |
| `azure_delete_iteration` | Deleta uma iteration | ✅ Work Items: **Read & Write** + **Project & Team: Read, Write & Manage** | 🔴 **CRÍTICO**: Work items não são deletados, apenas desassociados da sprint. |
| `azure_get_iteration_capacity` | Obtém capacity planning de uma sprint | ✅ Work Items: **Read** | - |

### 🔀 Pull Requests (2 tools)

| Tool | Descrição | Permissão Necessária | Alertas |
|------|-----------|----------------------|---------|
| `azure_list_pull_requests` | Lista PRs de um repositório | ✅ Code: **Read** | - |
| `azure_create_pull_request` | Cria um novo Pull Request | ✅ Code: **Read & Write** | ⚠️ Source branch e target branch devem existir. Title é obrigatório. |

### 👥 Teams (3 tools)

| Tool | Descrição | Permissão Necessária | Alertas |
|------|-----------|----------------------|---------|
| `azure_list_teams` | Lista todos os teams do projeto | ✅ Project & Team: **Read** | - |
| `azure_get_team` | Obtém detalhes de um team | ✅ Project & Team: **Read** | - |
| `azure_create_team` | Cria um novo team | ✅ Project & Team: **Read, Write & Manage** | ⚠️ Requer permissão de Project Admin. Nome deve ser único. |

### 📚 Repositories (2 tools)

| Tool | Descrição | Permissão Necessária | Alertas |
|------|-----------|----------------------|---------|
| `azure_list_repositories` | Lista todos os repositórios do projeto | ✅ Code: **Read** | - |
| `azure_get_repository` | Obtém detalhes de um repositório | ✅ Code: **Read** | - |

### 📖 Wikis (7 tools)

| Tool | Descrição | Permissão Necessária | Alertas |
|------|-----------|----------------------|---------|
| `azure_list_wikis` | Lista todas as wikis do projeto | ✅ Wiki: **Read** | - |
| `azure_get_wiki` | Obtém detalhes de uma wiki | ✅ Wiki: **Read** | - |
| `azure_create_wiki` | Cria uma nova wiki | ✅ Wiki: **Read & Write** | ⚠️ Nome deve ser único. Tipo pode ser `projectWiki` ou `codeWiki`. |
| `azure_list_wiki_pages` | Lista páginas de uma wiki | ✅ Wiki: **Read** | - |
| `azure_get_wiki_page` | Obtém conteúdo de uma página | ✅ Wiki: **Read** | - |
| `azure_create_wiki_page` | Cria uma nova página na wiki | ✅ Wiki: **Read & Write** | ⚠️ Path deve ser único. Conteúdo em Markdown. |
| `azure_update_wiki_page` | Atualiza uma página existente | ✅ Wiki: **Read & Write** | ⚠️ Requer `eTag` da versão anterior para evitar conflitos. |

---

## 🔐 Permissões do Azure DevOps

### Permissões Mínimas (Read-Only)

Para apenas **consultar** dados (resources):

```
✅ Work Items: Read
✅ Code: Read
✅ Wiki: Read
✅ Project & Team: Read
```

**Como configurar:**
1. Azure DevOps → User Settings → Personal Access Tokens
2. New Token → **Custom defined**
3. Selecione apenas: **Work Items (Read)**, **Code (Read)**, **Wiki (Read)**

### Permissões Recomendadas (Produtividade)

Para **criar e modificar** dados (tools):

```
✅ Work Items: Read & Write
✅ Code: Read & Write
✅ Wiki: Read & Write
✅ Project & Team: Read
```

### Permissões Avançadas (Administração)

Para **gerenciar boards, sprints e teams**:

```
✅ Work Items: Read & Write
✅ Code: Read & Write
✅ Wiki: Read & Write
✅ Project & Team: Read, Write & Manage
```

⚠️ **ATENÇÃO**: Permissões de **Manage** devem ser dadas apenas para usuários confiáveis, pois permitem:
- Criar/deletar teams
- Modificar configuração de boards
- Criar/deletar sprints
- Alterar estrutura do projeto

### Verificando Permissões

Teste cada permissão:

```bash
# Read-only test
User: "Liste meus work items"
→ Se funcionar: ✅ Work Items Read OK

# Write test
User: "Crie uma task de teste"
→ Se funcionar: ✅ Work Items Write OK
→ Se erro 403: ❌ Falta permissão de Write

# Admin test
User: "Crie um novo sprint"
→ Se funcionar: ✅ Project & Team Manage OK
→ Se erro 403: ❌ Falta permissão de Manage
```

---

## 💡 Exemplos de Uso

### 1. Consultando Work Items

```
User: "Quais são minhas tasks pendentes?"

Agent: [Acessa azure://work-items/my-tasks]
📋 Você tem 3 tasks pendentes:

1. #456 - Implementar autenticação JWT (To Do) - Prioridade: 1
2. #457 - Corrigir parser de markdown (In Progress) - Prioridade: 2
3. #789 - Refatorar componente de login (To Do) - Prioridade: 3
```

### 2. Criando Work Items

```
User: "Crie uma task para implementar cache Redis com prioridade alta"

Agent: [Chama azure_create_work_item]
✅ Task criada com sucesso!

📋 ID: #890
📝 Título: Implementar cache Redis
⏰ Estado: To Do
⚡ Prioridade: 1 (Alta)
🔗 URL: https://dev.azure.com/sua-org/projeto/_workitems/edit/890
```

### 3. Atualizando Work Items

```
User: "Marque a task #456 como Done"

Agent: [Chama azure_update_work_item]
✅ Task #456 atualizada!

📋 ID: #456
📝 Título: Implementar autenticação JWT
⏰ Estado: To Do → Done ✅
```

### 4. Queries WIQL Customizadas

```
User: "Me mostre todos os bugs criados nos últimos 7 dias com prioridade crítica"

Agent: [Chama azure_query_work_items]
🔍 Query WIQL:
SELECT [System.Id], [System.Title], [System.State]
FROM WorkItems
WHERE [System.WorkItemType] = 'Bug'
  AND [Microsoft.VSTS.Common.Priority] = 1
  AND [System.CreatedDate] >= @Today - 7

🔥 Encontrados 2 bugs críticos:
1. #891 - Login falha no iOS 17 (New)
2. #892 - Crash ao abrir perfil (New)
```

### 5. Gerenciando Sprints

```
User: "Crie um sprint de 2 semanas começando segunda-feira"

Agent: [Chama azure_create_iteration]
✅ Sprint criado com sucesso!

📅 Nome: Sprint 15
📆 Início: 2025-11-10
📆 Fim: 2025-11-24
🔗 URL: https://dev.azure.com/sua-org/projeto/_sprints/...
```

### 6. Pull Requests

```
User: "Crie um PR da branch feature/login para main com título 'Implementa autenticação JWT'"

Agent: [Chama azure_create_pull_request]
✅ Pull Request criado!

🔀 ID: #42
📝 Título: Implementa autenticação JWT
🌿 Source: feature/login → main
👤 Autor: Você
🔗 URL: https://dev.azure.com/sua-org/projeto/_git/repo/pullrequest/42
```

### 7. Wiki Management

```
User: "Crie uma página 'Getting Started' na wiki do projeto"

Agent: [Chama azure_create_wiki_page]
✅ Página criada!

📖 Wiki: Project Wiki
📄 Path: /Getting-Started
🔗 URL: https://dev.azure.com/sua-org/projeto/_wiki/wikis/...
```

---

## 🔍 Troubleshooting

### Server não aparece no Cursor

**Sintomas:**
- Cursor não mostra o servidor MCP na lista
- Agente não consegue acessar resources

**Soluções:**
1. Verifique que o path no `mcp.json` está correto (caminho absoluto)
2. Confirme que executou `npm run build` (pasta `dist/` existe)
3. Verifique sintaxe JSON do arquivo `mcp.json`
4. Reinicie o Cursor **completamente** (feche todas as janelas)
5. Verifique logs do Cursor: `Help → Show Logs`

### Erro 401 - Unauthorized

**Sintomas:**
```
Error: Request failed with status code 401
```

**Causas:**
- PAT inválido ou expirado
- PAT não configurado corretamente

**Soluções:**
1. Verifique que o PAT está correto no `mcp.json`
2. Gere um novo PAT no Azure DevOps
3. Confirme que o PAT não expirou
4. Teste o PAT manualmente:
```bash
curl -u :SEU_PAT https://dev.azure.com/sua-org/_apis/projects
```

### Erro 403 - Forbidden

**Sintomas:**
```
Error: Request failed with status code 403
```

**Causas:**
- PAT sem permissões suficientes
- Usuário sem acesso ao projeto

**Soluções:**
1. Verifique permissões do PAT (ver seção [Permissões](#permissões-do-azure-devops))
2. Confirme que seu usuário tem acesso ao projeto no Azure DevOps
3. Para ações de Write: PAT precisa de **Read & Write**
4. Para ações de Manage: PAT precisa de **Read, Write & Manage**

### Work Item não é criado

**Sintomas:**
```
Error: Work item type 'Task' not found
```

**Causas:**
- Tipo de work item não existe no process template do projeto

**Soluções:**
1. Verifique os tipos disponíveis no seu projeto:
   - Azure DevOps → Project Settings → Process
2. Process templates comuns:
   - **Agile**: Task, Bug, User Story, Epic, Feature
   - **Scrum**: Task, Bug, Product Backlog Item, Epic, Feature
   - **CMMI**: Task, Bug, Requirement, Epic, Feature
   - **Basic**: Issue, Task, Epic
3. Use o tipo correto para o seu project template

### Query WIQL falha

**Sintomas:**
```
Error: Invalid WIQL query syntax
```

**Causas:**
- Sintaxe WIQL inválida
- Campo não existe no projeto
- Operador inválido

**Soluções:**
1. Valide a sintaxe WIQL:
```sql
-- ✅ Correto
SELECT [System.Id], [System.Title]
FROM WorkItems
WHERE [System.State] = 'Active'

-- ❌ Errado (falta FROM)
SELECT [System.Id], [System.Title]
WHERE [System.State] = 'Active'
```

2. Teste a query no Azure DevOps:
   - Boards → Queries → New Query → Editor
3. Confirme que campos existem: `[System.FieldName]`
4. Use campos padrão quando possível

### Circuit Breaker Ativo

**Sintomas:**
```
Error: Circuit breaker is OPEN - too many failures
```

**Causas:**
- Muitas requisições falharam recentemente
- Azure DevOps pode estar indisponível

**Soluções:**
1. Aguarde 1 minuto (circuit breaker se reseta automaticamente)
2. Verifique status do Azure DevOps: https://status.dev.azure.com
3. Verifique sua conexão de internet
4. Consulte health do servidor:
```
User: "Qual o status do servidor?"
Agent: [Acessa azure://project/info]
```

### Rate Limit Excedido

**Sintomas:**
```
Error: Rate limit exceeded - too many requests
```

**Causas:**
- Muitas requisições em curto período
- Rate limiter protege contra spam

**Soluções:**
1. Aguarde alguns segundos
2. Evite fazer muitas requisições simultâneas
3. Rate limit padrão: 100 requisições/minuto

### Logs de Debug

Para investigar problemas, ative logs detalhados:

```json
{
  "mcpServers": {
    "azure-devops": {
      "env": {
        "LOG_LEVEL": "debug",
        "NODE_ENV": "development"
      }
    }
  }
}
```

Logs serão exibidos no stderr do Cursor.

---

## 🔧 Desenvolvimento

### Setup Local

```bash
# Clone
git clone https://github.com/seu-usuario/mcp-azure-devops.git
cd mcp-azure-devops

# Instale
npm install

# Build
npm run build

# Watch mode (rebuild automático)
npm run dev
```

### Scripts Disponíveis

```bash
npm run dev       # Modo desenvolvimento (tsx watch)
npm run build     # Compila TypeScript → JavaScript
npm run start     # Inicia servidor (node dist/index.js)
npm run test      # Executa testes (jest)
npm run test:watch # Testes em watch mode
npm run lint      # ESLint
npm run clean     # Remove dist/
```

### Testes

```bash
# Todos os testes
npm test

# Testes específicos
npm test -- work-items

# Cobertura
npm test -- --coverage
```

### Estrutura de Testes

```
tests/
├── integration/          # Testes de integração com Azure DevOps real
│   └── work-items.test.ts
└── mcp/                  # Testes de handlers MCP
    ├── resources.test.ts
    └── tools.test.ts
```

---

## 📚 Documentação Adicional

- **[QUICKSTART.md](QUICKSTART.md)** - Guia rápido de 5 minutos
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Arquitetura detalhada e decisões de design

### Links Úteis

- [Model Context Protocol (MCP)](https://modelcontextprotocol.io) - Especificação oficial
- [Azure DevOps REST API](https://learn.microsoft.com/en-us/rest/api/azure/devops) - Documentação da API
- [WIQL Syntax Reference](https://learn.microsoft.com/en-us/azure/devops/boards/queries/wiql-syntax) - Referência de queries
- [Azure DevOps Node API](https://github.com/microsoft/azure-devops-node-api) - SDK oficial

---

## 🤝 Contribuindo

Contribuições são muito bem-vindas! Este projeto é open source e livre para uso.

### Como Contribuir

1. **Fork** o repositório
2. **Clone** seu fork
3. **Crie uma branch**: `git checkout -b feature/minha-feature`
4. **Faça suas alterações**
5. **Commit**: `git commit -m "feat: adiciona nova feature"`
6. **Push**: `git push origin feature/minha-feature`
7. **Abra um Pull Request**

### Convenções

- **Commits**: Seguimos [Conventional Commits](https://www.conventionalcommits.org/)
  - `feat:` - Nova funcionalidade
  - `fix:` - Correção de bug
  - `docs:` - Documentação
  - `refactor:` - Refatoração
  - `test:` - Testes
  - `chore:` - Tarefas de manutenção

- **Code Style**: ESLint + Prettier (automático)
- **Type Safety**: TypeScript strict mode

### Áreas para Contribuir

- 🐛 **Bug Fixes** - Reporte ou corrija bugs
- ✨ **Features** - Novas funcionalidades
- 📖 **Documentação** - Melhore ou traduza docs
- 🧪 **Testes** - Aumente cobertura de testes
- 🎨 **UX** - Melhore mensagens e exemplos
- 🌍 **i18n** - Traduções para outros idiomas

---

## 📄 Licença

**MIT License** - Livre para uso comercial e pessoal

```
Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Em Resumo 🎉

**Pode:**
- ✅ Usar comercialmente
- ✅ Modificar como quiser
- ✅ Distribuir
- ✅ Usar em projetos privados
- ✅ Vender (se quiser)

**Não precisa:**
- ❌ Pedir permissão
- ❌ Dar créditos (mas é legal se fizer!)
- ❌ Compartilhar suas modificações
- ❌ Usar a mesma licença

**Tradução livre:** *"Pega, clona, mexe e não me incomoda!"* 😎

---

## 🙏 Agradecimentos

- **Anthropic** - Pela especificação do Model Context Protocol
- **Microsoft** - Pela API e SDK do Azure DevOps
- **Comunidade Open Source** - Por todas as bibliotecas utilizadas

---

## 📞 Suporte

- 🐛 **Issues**: [GitHub Issues](https://github.com/seu-usuario/mcp-azure-devops/issues)
- 💬 **Discussões**: [GitHub Discussions](https://github.com/seu-usuario/mcp-azure-devops/discussions)
- 📧 **Email**: seu-email@exemplo.com

---

<div align="center">

**Feito com ❤️ para a comunidade de desenvolvimento**

[⬆️ Voltar ao topo](#azure-devops-mcp-server)

</div>
