import { WorkItem, CreateWorkItemPayload, UpdateWorkItemPayload } from './work-items';
import { WiqlQuery, WiqlResult } from './wiql';
import { Board, BoardsListResult, BoardSettings } from './boards';

export type ProviderType = 'sdk' | 'http';

export interface ProviderHealth {
  healthy: boolean;
  lastCheck: Date;
  error?: string;
}

export interface IProvider {
  initialize(): Promise<void>;
  isHealthy(): boolean;
  getHealth(): ProviderHealth;
  createWorkItem(payload: CreateWorkItemPayload, useMarkdown?: boolean): Promise<WorkItem>;
  getWorkItem(id: number, fields?: string[]): Promise<WorkItem>;
  updateWorkItem(id: number, payload: UpdateWorkItemPayload, useMarkdown?: boolean): Promise<WorkItem>;
  deleteWorkItem(id: number): Promise<void>;
  getWorkItems(ids: number[], fields?: string[]): Promise<WorkItem[]>;
  executeWiql(query: WiqlQuery): Promise<WiqlResult>;
  listBoards(): Promise<BoardsListResult>;
  getBoard(boardId: string): Promise<Board>;
  updateBoardSettings(boardId: string, settings: Partial<BoardSettings>): Promise<Board>;
}

