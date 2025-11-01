import * as azdev from 'azure-devops-node-api';
import { IWorkItemTrackingApi } from 'azure-devops-node-api/WorkItemTrackingApi';
import { JsonPatchOperation as SdkJsonPatchOperation } from 'azure-devops-node-api/interfaces/common/VSSInterfaces';
import { Wiql } from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces';
import { BaseProvider } from './base.provider';
import { WorkItem, CreateWorkItemPayload, UpdateWorkItemPayload, WorkItemFields, WiqlQuery, WiqlResult, Board, BoardsListResult, BoardSettings } from '../types';

export class SdkProvider extends BaseProvider {
  private connection?: azdev.WebApi;
  private witApi?: IWorkItemTrackingApi;

  async initialize(): Promise<void> {
    try {
      const orgUrl = `${this.config.baseUrl}/${this.config.organization}`;
      const authHandler = azdev.getPersonalAccessTokenHandler(this.config.pat);
      
      this.connection = new azdev.WebApi(orgUrl, authHandler);
      this.witApi = await this.connection.getWorkItemTrackingApi();
      
      this.updateHealth(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateHealth(false, errorMessage);
      throw new Error(`SDK Provider initialization failed: ${errorMessage}`);
    }
  }

  async createWorkItem(payload: CreateWorkItemPayload, useMarkdown: boolean = true): Promise<WorkItem> {
    if (!this.witApi) {
      throw new Error('Provider not initialized');
    }

    const document: SdkJsonPatchOperation[] = Object.entries(payload.fields).map(([key, value]) => ({
      op: 'add',
      path: `/fields/${key}`,
      value
    } as unknown as SdkJsonPatchOperation));

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
          } as unknown as SdkJsonPatchOperation);
        }
      }
    }

    try {
      const result = await this.witApi.createWorkItem(
        null,
        document,
        this.config.project,
        payload.type
      );

      if (!result) {
        throw new Error(`SDK returned null. Check: 1) PAT has Write permissions, 2) Project name is correct, 3) Work item type '${payload.type}' exists in project`);
      }

      return this.convertToWorkItem(result);
    } catch (error) {
      if (error instanceof Error && error.message.includes('TF401232')) {
        throw new Error(`Work item type '${payload.type}' not found in project. Available types depend on your process template (Agile/Scrum/CMMI/Basic)`);
      }
      throw error;
    }
  }

  async getWorkItem(id: number, fields?: string[]): Promise<WorkItem> {
    if (!this.witApi) {
      throw new Error('Provider not initialized');
    }

    const result = await this.witApi.getWorkItem(
      id,
      fields
    );

    if (!result) {
      throw new Error(`Work item ${id} not found`);
    }

    return this.convertToWorkItem(result);
  }

  async updateWorkItem(id: number, payload: UpdateWorkItemPayload, useMarkdown: boolean = true): Promise<WorkItem> {
    if (!this.witApi) {
      throw new Error('Provider not initialized');
    }

    const sdkOperations: SdkJsonPatchOperation[] = payload.operations.map(op => op as unknown as SdkJsonPatchOperation);

    if (useMarkdown) {
      const multilineFields = [
        'System.Description',
        'Microsoft.VSTS.Common.AcceptanceCriteria',
        'Microsoft.VSTS.TCM.ReproSteps'
      ];

      for (const field of multilineFields) {
        const hasFieldUpdate = payload.operations.some(op => 
          op.path === `/fields/${field}` && op.op === 'add'
        );
        if (hasFieldUpdate) {
          sdkOperations.push({
            op: 'add',
            path: `/multilineFieldsFormat/${field}`,
            value: 'markdown'
          } as unknown as SdkJsonPatchOperation);
        }
      }
    }

    const result = await this.witApi.updateWorkItem(
      null,
      sdkOperations,
      id
    );

    if (!result) {
      throw new Error(`Failed to update work item ${id}`);
    }

    return this.convertToWorkItem(result);
  }

  async deleteWorkItem(id: number): Promise<void> {
    if (!this.witApi) {
      throw new Error('Provider not initialized');
    }

    await this.witApi.deleteWorkItem(id);
  }

  async getWorkItems(ids: number[], fields?: string[]): Promise<WorkItem[]> {
    if (!this.witApi) {
      throw new Error('Provider not initialized');
    }

    const results = await this.witApi.getWorkItems(
      ids,
      fields
    );

    return results.map(item => this.convertToWorkItem(item));
  }

  async executeWiql(query: WiqlQuery): Promise<WiqlResult> {
    if (!this.witApi) {
      throw new Error('Provider not initialized');
    }

    const wiql: Wiql = {
      query: query.query
    };

    const teamContext = {
      project: this.config.project
    };

    const result = await this.witApi.queryByWiql(wiql, teamContext);

    if (!result) {
      throw new Error('WIQL query returned null');
    }

    const queryTypeMap: Record<string, 'flat' | 'tree' | 'oneHop'> = {
      'flat': 'flat',
      'tree': 'tree',
      'oneHop': 'oneHop'
    };

    const queryType = result.queryType ? 
      queryTypeMap[result.queryType.toString()] || 'flat' : 
      'flat';

    return {
      queryType,
      queryResultType: result.queryResultType?.toString() || 'workItem',
      asOf: result.asOf?.toISOString() || new Date().toISOString(),
      workItems: (result.workItems || []).map(wi => ({
        id: wi.id || 0,
        url: wi.url || ''
      })),
      columns: result.columns?.map(col => ({
        referenceName: col.referenceName || '',
        name: col.name || '',
        url: col.url || ''
      }))
    };
  }

  private convertToWorkItem(sdkWorkItem: unknown): WorkItem {
    if (!sdkWorkItem) {
      throw new Error('SDK returned null or undefined work item');
    }

    const item = sdkWorkItem as { id?: number; rev?: number; fields?: Record<string, unknown>; url?: string; _links?: { html?: { href?: string } } };
    
    if (!item.id) {
      throw new Error('Work item missing required field: id');
    }

    return {
      id: item.id,
      rev: item.rev || 1,
      fields: (item.fields || {}) as WorkItemFields,
      url: item.url || item._links?.html?.href || ''
    };
  }

  async listBoards(): Promise<BoardsListResult> {
    if (!this.connection) {
      throw new Error('Provider not initialized');
    }

    const workApi = await this.connection.getWorkApi();
    const teamContext = { project: this.config.project };
    
    const boards = await workApi.getBoards(teamContext);
    
    if (!boards) {
      return { value: [], count: 0 };
    }

    return {
      value: boards.map(b => ({
        id: b.id || '',
        name: b.name || '',
        url: b.url || '',
        columns: [],
        settings: {
          cardReordering: true,
          backlogVisibilities: {}
        }
      })),
      count: boards.length
    };
  }

  async getBoard(boardId: string): Promise<Board> {
    if (!this.connection) {
      throw new Error('Provider not initialized');
    }

    const workApi = await this.connection.getWorkApi();
    const teamContext = { project: this.config.project };
    
    const board = await workApi.getBoard(teamContext, boardId);
    
    if (!board) {
      throw new Error(`Board ${boardId} not found`);
    }

    return {
      id: board.id || '',
      name: board.name || '',
      url: board.url || '',
      columns: [],
      settings: {
        cardReordering: true,
        backlogVisibilities: {}
      }
    };
  }

  async updateBoardSettings(boardId: string, _settings: Partial<BoardSettings>): Promise<Board> {
    if (!this.connection) {
      throw new Error('Provider not initialized');
    }

    return this.getBoard(boardId);
  }
}

