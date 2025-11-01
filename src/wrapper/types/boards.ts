export interface BoardColumn {
  readonly id: string;
  readonly name: string;
  readonly columnType: 'incoming' | 'inProgress' | 'outgoing';
  itemLimit?: number;
  stateMappings?: Record<string, string>;
}

export interface BoardSettings {
  cardReordering?: boolean;
  backlogVisibilities?: {
    [key: string]: boolean;
  };
}

export interface Board {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  columns: readonly BoardColumn[];
  settings: BoardSettings;
}

export interface BoardsListResult {
  value: Board[];
  count: number;
}

