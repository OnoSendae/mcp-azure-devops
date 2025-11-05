# Azure DevOps MCP Server - Quickstart

Guia rápido para configurar e usar o servidor MCP.

## 1. Pré-requisitos

- Node.js >= 18
- Azure DevOps account
- Personal Access Token (PAT) com permissões de Work Items (Read & Write)

## 2. Instalação

```bash
cd /caminho/para/mcp-azure-devops
npm install
```

## 3. Configuração

Copie `.env.example` para `.env` e configure:

```env
AZURE_DEVOPS_PAT=seu_personal_access_token_aqui
AZURE_DEVOPS_ORG=nome_da_sua_organizacao
AZURE_DEVOPS_PROJECT=nome_do_seu_projeto
```

## 4. Build

```bash
npm run build
```

## 5. Configurar no Cursor

Edite `~/.cursor/mcp.json` (criar se não existir):

```json
{
  "mcpServers": {
    "azure-devops": {
      "command": "node",
      "args": [
        "/caminho/completo/para/mcp-azure-devops/dist/index.js"
      ],
      "env": {
        "AZURE_DEVOPS_PAT": "seu_pat_aqui",
        "AZURE_DEVOPS_ORG": "sua_org",
        "AZURE_DEVOPS_PROJECT": "seu_projeto"
      }
    }
  }
}
```

## 6. Reiniciar Cursor

Feche e reabra o Cursor completamente.

## 7. Testar

Pergunte ao agente no Cursor:

```
"Quais são minhas tasks pendentes no Azure DevOps?"
```

Se funcionou, você verá a lista de suas tasks!

## 8. Exemplos de Uso

### Consultar work items

- "Quais são minhas tasks?"
- "Mostre os bugs críticos abertos"
- "Qual o status da task #123?"

### Criar work items

- "Crie uma task para implementar login JWT"
- "Crie um bug para o crash que encontrei"

### Atualizar work items

- "Marque a task #456 como Done"
- "Atribua o bug #789 para usuario@exemplo.com"

### Query WIQL

- "Mostre todos os bugs criados nos últimos 7 dias"
- "Quais tasks estão bloqueadas?"

## Troubleshooting

### Server não aparece no Cursor

1. Verifique que path no mcp.json está correto
2. Confirme que build foi executado (pasta `dist/` existe)
3. Reinicie o Cursor completamente

### Erro ao buscar work items

1. Valide PAT no .env
2. Confirme que org e project estão corretos
3. Verifique permissões do PAT no Azure DevOps

### Logs

Logs vão para stderr. Para debug, execute manualmente:

```bash
node dist/index.js 2> debug.log
```

## Próximos Passos

- Explore os 7 tools disponíveis
- Experimente queries WIQL customizadas
- Configure notificações e integrações

---

**Pronto!** Seu servidor MCP Azure DevOps está configurado e funcionando! 🚀

