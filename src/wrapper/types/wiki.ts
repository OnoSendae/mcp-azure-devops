export type WikiType = 'projectWiki' | 'codeWiki';

export interface Wiki {
  readonly id: string;
  readonly name: string;
  readonly projectId: string;
  readonly repositoryId: string;
  readonly type: WikiType;
  readonly url: string;
  readonly remoteUrl: string;
  readonly mappedPath?: string;
  readonly versions?: readonly WikiVersion[];
}

export interface WikiVersion {
  readonly version: string;
  readonly path?: string;
}

export interface WikiPage {
  readonly id: number;
  readonly path: string;
  readonly order: number;
  readonly gitItemPath: string;
  readonly url?: string;
  readonly remoteUrl?: string;
  content?: string;
  readonly isParentPage: boolean;
  readonly isNonConformant?: boolean;
  subPages?: readonly WikiPage[];
}

export interface WikiPageDetail extends WikiPage {
  readonly content: string;
  readonly eTag?: readonly string[];
}

export interface CreateWikiPayload {
  readonly name: string;
  readonly projectId: string;
  readonly type?: WikiType;
  readonly repositoryId?: string;
  readonly mappedPath?: string;
  readonly version?: {
    readonly version: string;
  };
}

export interface CreateWikiPagePayload {
  readonly content: string;
}

export interface UpdateWikiPagePayload {
  readonly content: string;
}

export interface WikisListResult {
  value: Wiki[];
  count: number;
}

export interface WikiPagesListResult {
  value: WikiPage[];
  count: number;
}

