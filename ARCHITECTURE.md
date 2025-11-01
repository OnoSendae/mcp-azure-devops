# Arquitetura do Azure DevOps MCP Server

## Visão Geral

Servidor MCP (Model Context Protocol) que expõe o Azure DevOps através de Resources e Tools, permitindo agentes IA interagirem naturalmente com work items.

## Camadas

```
┌─────────────────────────────────────────┐
│         MCP Protocol Layer              │
│  (STDIO transport + JSON-RPC 2.0)       │
├─────────────────────────────────────────┤
│         MCP Server Instance             │
│  ┌───────────┐  ┌──────────────────┐   │
│  │ Resources │  │      Tools       │   │
│  │    (4)    │  │       (7)        │   │
│  └───────────┘  └──────────────────┘   │
├─────────────────────────────────────────┤
│      Azure DevOps Wrapper (v0.2.0)      │
│  ┌────────────┐  ┌─────────────────┐   │
│  │ Work Items │  │      WIQL       │   │
│  │    API     │  │      API        │   │
│  └────────────┘  └─────────────────┘   │
├─────────────────────────────────────────┤
│         Provider Layer (Híbrido)        │
│  ┌────────────┐  ┌─────────────────┐   │
│  │    SDK     │  │      HTTP       │   │
│  │  Provider  │  │    Provider     │   │
│  └────────────┘  └─────────────────┘   │
├─────────────────────────────────────────┤
│    Resilience + Logging + Telemetry     │
│  - Retry com exponential backoff        │
│  - Circuit Breaker                      │
│  - Rate Limiting (token bucket)         │
│  - Structured logging (stderr)          │
│  - Telemetry collection                 │
└─────────────────────────────────────────┘
           ↓
    Azure DevOps REST API
```

## Componentes

### MCP Layer

#### Entry Point (`src/index.ts`)
- Inicializa Azure DevOps client
- Cria instância do MCP Server
- Configura STDIO transport
- Conecta server ao transport

#### Server Init (`src/server.ts`)
- Registra resources handlers
- Registra tools handlers
- Logs de inicialização (stderr)

#### Resources (`src/mcp/resources/`)
- **my-tasks**: Work items atribuídos ao usuário
- **bugs**: Todos os bugs abertos
- **all**: Todos work items (max 200)
- **project-info**: Info e health do servidor

#### Tools (`src/mcp/tools/`)
- **create_work_item**: Criar task/bug/story
- **update_work_item**: Atualizar campos
- **delete_work_item**: Deletar work item
- **get_work_item**: Buscar por ID
- **query_work_items**: Query WIQL customizada
- **get_my_tasks**: Helper para minhas tasks
- **get_critical_bugs**: Helper para bugs críticos

#### Schemas (`src/mcp/schemas/`)
- JSON Schemas para cada tool
- Validação de inputs
- Documentação inline

### Wrapper Layer

Reutiliza wrapper existente (v0.2.0) com todas as features:
- Work Items API (CRUD)
- WIQL API (queries SQL-like)
- Hybrid providers (SDK/HTTP)
- Resilience (Retry, Circuit Breaker)
- Rate Limiting
- Logging estruturado
- Telemetry collection

## Fluxo de Dados

### Resources (Read)

```
Agent → MCP Client
  ↓
ReadResourceRequest(uri)
  ↓
MCP Server → registerResources handler
  ↓
Switch by URI
  ↓
client.wiql.queryAndGet(query, fields, options)
  ↓
Provider (SDK/HTTP fallback)
  ↓
Azure DevOps API
  ↓
Work Items returned
  ↓
JSON formatted response
  ↓
Agent receives data
```

### Tools (Execute)

```
Agent → MCP Client
  ↓
CallToolRequest(name, arguments)
  ↓
MCP Server → registerTools handler
  ↓
Switch by tool name
  ↓
Validate inputs with schema
  ↓
client.workItems.create/update/delete/get()
  ↓
Retry Policy (exponential backoff)
  ↓
Circuit Breaker (fail fast if unhealthy)
  ↓
Rate Limiter (token bucket)
  ↓
Provider (SDK/HTTP fallback)
  ↓
Azure DevOps API
  ↓
Result returned
  ↓
Format response (emojis, legible)
  ↓
Agent receives response
```

## Decisões Técnicas

### 1. Wrapper como Código Copiado

**Decisão**: Copiar código do wrapper para `src/wrapper/`

**Alternativas**:
- Wrapper como dependência npm
- Monorepo

**Rationale**:
- Self-contained (mais simples)
- Facilita debugging
- Fase de prototipagem
- Futuro: publicar como package

### 2. STDIO Transport

**Decisão**: STDIO (padrão MCP)

**Rationale**:
- Padrão do Model Context Protocol
- Suportado nativamente pelo Cursor
- Simples de configurar
- Funciona localmente

### 3. Logs para stderr

**Decisão**: Redirecionar Pino para stderr (fd 2)

**Rationale**:
- stdout reservado para JSON-RPC do MCP
- Logs não podem poluir protocol
- Pino suporta custom destinations

### 4. Error Handling

**Decisão**: Erros formatados como MCP responses

**Formato**:
```typescript
{
  content: [{
    type: 'text',
    text: '❌ Erro: mensagem\n\nVerifique:\n1. Item 1\n2. Item 2'
  }],
  isError: true
}
```

**Rationale**:
- Mensagens actionable
- Sugestões de correção
- Não crasha o server
- UX amigável para agente

## Extensibilidade

### Adicionar Novo Resource

1. Adicionar URI no `ListResourcesRequest`
2. Criar handler function
3. Adicionar case no switch de `ReadResourceRequest`
4. Implementar query WIQL ou lógica custom

### Adicionar Novo Tool

1. Criar schema em `src/mcp/schemas/`
2. Adicionar tool definition no `ListToolsRequest`
3. Criar handler function
4. Adicionar case no switch de `CallToolRequest`
5. Implementar lógica usando wrapper APIs

## Performance

### Rate Limiting

- Client-side: 100 req/min (token bucket)
- Compartilhado entre todos tools/resources
- Configurável via env var

### Caching (Futuro)

Resources que se beneficiariam:
- my-tasks (TTL: 60s)
- bugs (TTL: 60s)
- all (TTL: 120s)
- project-info (TTL: 300s)

Não implementado no MVP.

## Segurança

### Autenticação

- PAT (Personal Access Token) via env var
- Redacted nos logs (pino.redact)
- Nunca exposto em responses

### Validação

- JSON Schemas validam inputs
- WIQL queries validadas (syntax check)
- Rate limiting previne abuse

## Observabilidade

### Logging

- Pino structured logging
- Output: stderr
- Levels: debug, info, warn, error
- Redaction de credenciais

### Telemetry

- Request count
- Success/error rates
- Duration tracking
- Provider usage stats

## Deployment

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
node dist/index.js
```

### Cursor Integration

Adicionar em `~/.cursor/mcp.json` e reiniciar Cursor.

## Testes

### Unit Tests
- Mock do Azure client
- Validar schemas
- Testar formatação de responses

### Integration Tests
- ListResources retorna 4
- ReadResource funciona para cada URI
- CallTool funciona para cada tool
- Error cases tratados

## Métricas de Sucesso

- Build sem erros: ✅
- Testes passando: Pendente
- Logs não poluem stdout: ✅
- Server inicia: Pendente (testar manual)
- Agente conversa naturalmente: Pendente (testar manual)

## Próximos Passos (v2)

- Cache layer para resources
- Boards API tools
- Webhooks para real-time
- Batch operations
- Prompts templates

