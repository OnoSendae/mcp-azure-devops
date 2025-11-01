import axios, { AxiosInstance } from 'axios';
import { BaseProvider } from './base.provider';
import { WorkItem, CreateWorkItemPayload, UpdateWorkItemPayload, WiqlQuery, WiqlResult, Board, BoardsListResult, BoardSettings } from '../types';

export class HttpProvider extends BaseProvider {
  private client?: AxiosInstance;

  async initialize(): Promise<void> {
    try {
      const baseURL = `${this.config.baseUrl}/${this.config.organization}/${this.config.project}/_apis`;
      const token = Buffer.from(`:${this.config.pat}`).toString('base64');

      this.client = axios.create({
        baseURL,
        headers: {
          'Authorization': `Basic ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          'api-version': this.config.apiVersion
        }
      });

      await this.client.get('/projects');
      this.updateHealth(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateHealth(false, errorMessage);
      throw new Error(`HTTP Provider initialization failed: ${errorMessage}`);
    }
  }

  async createWorkItem(payload: CreateWorkItemPayload, useMarkdown: boolean = true): Promise<WorkItem> {
    if (!this.client) {
      throw new Error('Provider not initialized');
    }

    const document = Object.entries(payload.fields).map(([key, value]) => ({
      op: 'add',
      path: `/fields/${key}`,
      value
    }));

    if (useMarkdown) {
      const multilineFields = [
        'System.Description',
        'Microsoft.VSTS.Common.AcceptanceCriteria',
        'Microsoft.VSTS.TCM.ReproSteps'
      ];

      for (const field of multilineFields) {
        if (payload.fields[field]) {
          document.push({
            op: 'add',
            path: `/multilineFieldsFormat/${field}`,
            value: 'markdown'
          });
        }
      }
    }

    const response = await this.client.post<WorkItem>(
      `/wit/workitems/$${payload.type}`,
      document,
      {
        headers: {
          'Content-Type': 'application/json-patch+json'
        }
      }
    );

    return response.data;
  }

  async getWorkItem(id: number, fields?: string[]): Promise<WorkItem> {
    if (!this.client) {
      throw new Error('Provider not initialized');
    }

    const params: Record<string, unknown> = {};
    if (fields && fields.length > 0) {
      params.fields = fields.join(',');
    }

    const response = await this.client.get<WorkItem>(`/wit/workitems/${id}`, { params });
    return response.data;
  }

  async updateWorkItem(id: number, payload: UpdateWorkItemPayload, useMarkdown: boolean = true): Promise<WorkItem> {
    if (!this.client) {
      throw new Error('Provider not initialized');
    }

    const operations = [...payload.operations];

    if (useMarkdown) {
      const multilineFields = [
        'System.Description',
        'Microsoft.VSTS.Common.AcceptanceCriteria',
        'Microsoft.VSTS.TCM.ReproSteps'
      ];

      for (const field of multilineFields) {
        const hasFieldUpdate = operations.some(op => 
          op.path === `/fields/${field}` && op.op === 'add'
        );
        if (hasFieldUpdate) {
          operations.push({
            op: 'add',
            path: `/multilineFieldsFormat/${field}`,
            value: 'markdown'
          });
        }
      }
    }

    const response = await this.client.patch<WorkItem>(
      `/wit/workitems/${id}`,
      operations,
      {
        headers: {
          'Content-Type': 'application/json-patch+json'
        }
      }
    );

    return response.data;
  }

  async deleteWorkItem(id: number): Promise<void> {
    if (!this.client) {
      throw new Error('Provider not initialized');
    }

    await this.client.delete(`/wit/workitems/${id}`);
  }

  async getWorkItems(ids: number[], fields?: string[]): Promise<WorkItem[]> {
    if (!this.client) {
      throw new Error('Provider not initialized');
    }

    const params: Record<string, unknown> = {
      ids: ids.join(',')
    };
    
    if (fields && fields.length > 0) {
      params.fields = fields.join(',');
    }

    const response = await this.client.get<{ value: WorkItem[] }>('/wit/workitems', { params });
    return response.data.value;
  }

  async executeWiql(query: WiqlQuery): Promise<WiqlResult> {
    if (!this.client) {
      throw new Error('Provider not initialized');
    }

    const body = {
      query: query.query
    };

    const params: Record<string, unknown> = {};
    if (query.top) {
      params.$top = query.top;
    }
    if (query.timePrecision !== undefined) {
      params.timePrecision = query.timePrecision;
    }

    const response = await this.client.post<WiqlResult>('/wit/wiql', body, { params });
    return response.data;
  }

  async listBoards(): Promise<BoardsListResult> {
    if (!this.client) {
      throw new Error('Provider not initialized');
    }

    const response = await this.client.get<BoardsListResult>('/work/boards');
    return response.data;
  }

  async getBoard(boardId: string): Promise<Board> {
    if (!this.client) {
      throw new Error('Provider not initialized');
    }

    const response = await this.client.get<Board>(`/work/boards/${boardId}`);
    return response.data;
  }

  async updateBoardSettings(boardId: string, settings: Partial<BoardSettings>): Promise<Board> {
    if (!this.client) {
      throw new Error('Provider not initialized');
    }

    const patchDocument = [];
    
    if (settings.cardReordering !== undefined) {
      patchDocument.push({
        op: 'replace',
        path: '/cardSettings/cardReordering',
        value: settings.cardReordering
      });
    }
    
    if (settings.backlogVisibilities) {
      patchDocument.push({
        op: 'replace',
        path: '/backlogVisibilities',
        value: settings.backlogVisibilities
      });
    }

    const response = await this.client.put<Board>(
      `/work/boards/${boardId}`,
      patchDocument,
      {
        headers: {
          'Content-Type': 'application/json-patch+json'
        }
      }
    );

    return response.data;
  }
}

