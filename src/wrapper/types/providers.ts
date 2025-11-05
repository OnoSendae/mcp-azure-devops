import { WorkItem, CreateWorkItemPayload, UpdateWorkItemPayload } from './work-items';
import { WiqlQuery, WiqlResult } from './wiql';
import { Board, BoardsListResult, BoardSettings } from './boards';
import { TeamIteration, IterationCapacity, IterationWorkItems, CreateIterationPayload } from './iterations';
import { PullRequest, PullRequestListResult, CreatePullRequestPayload, UpdatePullRequestPayload, MergePullRequestPayload, AddCommentPayload, AddReviewerPayload, PullRequestVotePayload, PullRequestThread, GitRepository, RepositoriesListResult } from './pull-requests';
import { Team, TeamsListResult, TeamMember, TeamMembersResult, CreateTeamPayload, UpdateTeamPayload, AddTeamMemberPayload } from './teams';
import { Wiki, WikisListResult, WikiPage, WikiPagesListResult, CreateWikiPayload, CreateWikiPagePayload, UpdateWikiPagePayload } from './wiki';

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
  listIterations(team?: string): Promise<TeamIteration[]>;
  getIteration(iterationId: string, team?: string): Promise<TeamIteration>;
  createIteration(data: CreateIterationPayload, team?: string): Promise<TeamIteration>;
  deleteIteration(iterationId: string, team?: string): Promise<void>;
  getIterationCapacity(iterationId: string, team?: string): Promise<IterationCapacity[]>;
  getIterationWorkItems(iterationId: string, team?: string): Promise<IterationWorkItems>;
  listPullRequests(repositoryId: string, status?: string): Promise<PullRequestListResult>;
  getPullRequest(repositoryId: string, pullRequestId: number): Promise<PullRequest>;
  createPullRequest(repositoryId: string, data: CreatePullRequestPayload): Promise<PullRequest>;
  updatePullRequest(repositoryId: string, pullRequestId: number, data: UpdatePullRequestPayload): Promise<PullRequest>;
  mergePullRequest(repositoryId: string, pullRequestId: number, data: MergePullRequestPayload): Promise<PullRequest>;
  addPullRequestComment(repositoryId: string, pullRequestId: number, data: AddCommentPayload): Promise<PullRequestThread>;
  addPullRequestReviewer(repositoryId: string, pullRequestId: number, data: AddReviewerPayload): Promise<PullRequest>;
  votePullRequest(repositoryId: string, pullRequestId: number, reviewerId: string, data: PullRequestVotePayload): Promise<PullRequest>;
  listRepositories(): Promise<RepositoriesListResult>;
  getRepository(repositoryId: string): Promise<GitRepository>;
  listTeams(): Promise<TeamsListResult>;
  getTeam(teamId: string): Promise<Team>;
  createTeam(data: CreateTeamPayload): Promise<Team>;
  updateTeam(teamId: string, data: UpdateTeamPayload): Promise<Team>;
  deleteTeam(teamId: string): Promise<void>;
  listTeamMembers(teamId: string): Promise<TeamMembersResult>;
  addTeamMember(teamId: string, data: AddTeamMemberPayload): Promise<TeamMember>;
  removeTeamMember(teamId: string, userId: string): Promise<void>;
  listWikis(): Promise<WikisListResult>;
  getWiki(wikiIdentifier: string): Promise<Wiki>;
  createWiki(data: CreateWikiPayload): Promise<Wiki>;
  deleteWiki(wikiIdentifier: string): Promise<void>;
  listWikiPages(wikiIdentifier: string, path?: string): Promise<WikiPagesListResult>;
  getWikiPage(wikiIdentifier: string, path: string, includeContent?: boolean): Promise<WikiPage>;
  createWikiPage(wikiIdentifier: string, path: string, data: CreateWikiPagePayload): Promise<WikiPage>;
  updateWikiPage(wikiIdentifier: string, path: string, data: UpdateWikiPagePayload): Promise<WikiPage>;
  deleteWikiPage(wikiIdentifier: string, path: string): Promise<void>;
}

