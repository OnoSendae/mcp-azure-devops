import { IProvider, ProviderHealth, WorkItem, CreateWorkItemPayload, UpdateWorkItemPayload, WiqlQuery, WiqlResult, Board, BoardsListResult, BoardSettings } from '../types';
import { AzureDevOpsConfig } from '../config';

export abstract class BaseProvider implements IProvider {
  protected config: AzureDevOpsConfig;
  protected health: ProviderHealth;

  constructor(config: AzureDevOpsConfig) {
    this.config = config;
    this.health = {
      healthy: false,
      lastCheck: new Date()
    };
  }

  abstract initialize(): Promise<void>;
  abstract createWorkItem(payload: CreateWorkItemPayload, useMarkdown?: boolean): Promise<WorkItem>;
  abstract getWorkItem(id: number, fields?: string[]): Promise<WorkItem>;
  abstract updateWorkItem(id: number, payload: UpdateWorkItemPayload, useMarkdown?: boolean): Promise<WorkItem>;
  abstract deleteWorkItem(id: number): Promise<void>;
  abstract getWorkItems(ids: number[], fields?: string[]): Promise<WorkItem[]>;
  abstract executeWiql(query: WiqlQuery): Promise<WiqlResult>;
  abstract listBoards(): Promise<BoardsListResult>;
  abstract getBoard(boardId: string): Promise<Board>;
  abstract updateBoardSettings(boardId: string, settings: Partial<BoardSettings>): Promise<Board>;

  isHealthy(): boolean {
    return this.health.healthy;
  }

  getHealth(): ProviderHealth {
    return { ...this.health };
  }

  protected updateHealth(healthy: boolean, error?: string): void {
    this.health = {
      healthy,
      lastCheck: new Date(),
      error
    };
  }
}

