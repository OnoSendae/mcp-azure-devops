export type QueryType = 'flat' | 'tree' | 'oneHop';

export interface WiqlQuery {
  query: string;
  top?: number;
  timePrecision?: boolean;
}

export interface WiqlWorkItemReference {
  id: number;
  url: string;
}

export interface WiqlResult {
  queryType: QueryType;
  queryResultType: string;
  asOf: string;
  workItems: WiqlWorkItemReference[];
  columns?: Array<{
    referenceName: string;
    name: string;
    url: string;
  }>;
}

export interface WiqlQueryOptions {
  top?: number;
  timePrecision?: boolean;
}

