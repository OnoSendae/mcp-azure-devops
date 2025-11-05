import { IProvider, ProviderHealth, WorkItem, CreateWorkItemPayload, UpdateWorkItemPayload, WiqlQuery, WiqlResult, Board, BoardsListResult, BoardSettings, TeamIteration, IterationCapacity, IterationWorkItems, CreateIterationPayload, PullRequest, PullRequestListResult, CreatePullRequestPayload, UpdatePullRequestPayload, MergePullRequestPayload, AddCommentPayload, AddReviewerPayload, PullRequestVotePayload, PullRequestThread, GitRepository, RepositoriesListResult, Team, TeamsListResult, TeamMember, TeamMembersResult, CreateTeamPayload, UpdateTeamPayload, AddTeamMemberPayload } from '../types';
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
  abstract listIterations(team?: string): Promise<TeamIteration[]>;
  abstract getIteration(iterationId: string, team?: string): Promise<TeamIteration>;
  abstract createIteration(data: CreateIterationPayload, team?: string): Promise<TeamIteration>;
  abstract deleteIteration(iterationId: string, team?: string): Promise<void>;
  abstract getIterationCapacity(iterationId: string, team?: string): Promise<IterationCapacity[]>;
  abstract getIterationWorkItems(iterationId: string, team?: string): Promise<IterationWorkItems>;
  abstract listPullRequests(repositoryId: string, status?: string): Promise<PullRequestListResult>;
  abstract getPullRequest(repositoryId: string, pullRequestId: number): Promise<PullRequest>;
  abstract createPullRequest(repositoryId: string, data: CreatePullRequestPayload): Promise<PullRequest>;
  abstract updatePullRequest(repositoryId: string, pullRequestId: number, data: UpdatePullRequestPayload): Promise<PullRequest>;
  abstract mergePullRequest(repositoryId: string, pullRequestId: number, data: MergePullRequestPayload): Promise<PullRequest>;
  abstract addPullRequestComment(repositoryId: string, pullRequestId: number, data: AddCommentPayload): Promise<PullRequestThread>;
  abstract addPullRequestReviewer(repositoryId: string, pullRequestId: number, data: AddReviewerPayload): Promise<PullRequest>;
  abstract votePullRequest(repositoryId: string, pullRequestId: number, reviewerId: string, data: PullRequestVotePayload): Promise<PullRequest>;
  abstract listRepositories(): Promise<RepositoriesListResult>;
  abstract getRepository(repositoryId: string): Promise<GitRepository>;
  abstract listTeams(): Promise<TeamsListResult>;
  abstract getTeam(teamId: string): Promise<Team>;
  abstract createTeam(data: CreateTeamPayload): Promise<Team>;
  abstract updateTeam(teamId: string, data: UpdateTeamPayload): Promise<Team>;
  abstract deleteTeam(teamId: string): Promise<void>;
  abstract listTeamMembers(teamId: string): Promise<TeamMembersResult>;
  abstract addTeamMember(teamId: string, data: AddTeamMemberPayload): Promise<TeamMember>;
  abstract removeTeamMember(teamId: string, userId: string): Promise<void>;
  abstract listWikis(): Promise<import('../types/wiki').WikisListResult>;
  abstract getWiki(wikiIdentifier: string): Promise<import('../types/wiki').Wiki>;
  abstract createWiki(data: import('../types/wiki').CreateWikiPayload): Promise<import('../types/wiki').Wiki>;
  abstract deleteWiki(wikiIdentifier: string): Promise<void>;
  abstract listWikiPages(wikiIdentifier: string, path?: string): Promise<import('../types/wiki').WikiPagesListResult>;
  abstract getWikiPage(wikiIdentifier: string, path: string, includeContent?: boolean): Promise<import('../types/wiki').WikiPage>;
  abstract createWikiPage(wikiIdentifier: string, path: string, data: import('../types/wiki').CreateWikiPagePayload): Promise<import('../types/wiki').WikiPage>;
  abstract updateWikiPage(wikiIdentifier: string, path: string, data: import('../types/wiki').UpdateWikiPagePayload): Promise<import('../types/wiki').WikiPage>;
  abstract deleteWikiPage(wikiIdentifier: string, path: string): Promise<void>;

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

