import axios, { AxiosInstance } from 'axios';
import { BaseProvider } from './base.provider';
import { WorkItem, CreateWorkItemPayload, UpdateWorkItemPayload, AddWorkItemRelationPayload, WorkItemRelationType, WiqlQuery, WiqlResult, Board, BoardsListResult, BoardSettings, TeamIteration, IterationCapacity, IterationWorkItems, CreateIterationPayload, PullRequest, PullRequestListResult, CreatePullRequestPayload, UpdatePullRequestPayload, MergePullRequestPayload, AddCommentPayload, AddReviewerPayload, PullRequestVotePayload, PullRequestThread, GitRepository, RepositoriesListResult, Team, TeamsListResult, TeamMember, TeamMembersResult, CreateTeamPayload, UpdateTeamPayload, AddTeamMemberPayload, Wiki, WikisListResult, WikiPage, WikiPagesListResult, CreateWikiPayload, CreateWikiPagePayload, UpdateWikiPagePayload } from '../types';

export class HttpProvider extends BaseProvider {
  private client?: AxiosInstance;
  private gitClient?: AxiosInstance;

  async initialize(): Promise<void> {
    try {
      const baseURL = `${this.config.baseUrl}/${this.config.organization}/${this.config.project}/_apis`;
      const gitBaseURL = `${this.config.baseUrl}/${this.config.organization}/_apis`;
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

      this.gitClient = axios.create({
        baseURL: gitBaseURL,
        headers: {
          'Authorization': `Basic ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          'api-version': this.config.apiVersion
        }
      });

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

  async addWorkItemRelation(payload: AddWorkItemRelationPayload): Promise<WorkItem> {
    if (!this.client) {
      throw new Error('Provider not initialized');
    }

    const relationTypeMap: Record<WorkItemRelationType, string> = {
      parent: 'System.LinkTypes.Hierarchy-Reverse',
      related: 'System.LinkTypes.Related',
      predecessor: 'System.LinkTypes.Dependency-Reverse',
      successor: 'System.LinkTypes.Dependency-Forward'
    };

    const relationType = relationTypeMap[payload.relationType];
    const targetUrl = `${this.config.baseUrl}/${this.config.organization}/${this.config.project}/_apis/wit/workitems/${payload.targetWorkItemId}`;

    const operation = {
      op: 'add',
      path: '/relations/-',
      value: {
        rel: relationType,
        url: targetUrl,
        ...(payload.comment && { attributes: { comment: payload.comment } })
      }
    };

    const response = await this.client.patch<WorkItem>(
      `/wit/workitems/${payload.workItemId}`,
      [operation],
      {
        headers: {
          'Content-Type': 'application/json-patch+json'
        }
      }
    );

    return response.data;
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

  async listIterations(team?: string): Promise<TeamIteration[]> {
    if (!this.client) {
      throw new Error('Provider not initialized');
    }

    const teamName = team || this.config.team || this.config.project;
    const response = await this.client.get<{ value: TeamIteration[] }>(`/${this.config.project}/${teamName}/_apis/work/teamsettings/iterations`);
    return response.data.value || [];
  }

  async getIteration(iterationId: string, team?: string): Promise<TeamIteration> {
    if (!this.client) {
      throw new Error('Provider not initialized');
    }

    const teamName = team || this.config.team || this.config.project;
    const response = await this.client.get<TeamIteration>(`/${this.config.project}/${teamName}/_apis/work/teamsettings/iterations/${iterationId}`);
    return response.data;
  }

  async createIteration(data: CreateIterationPayload, team?: string): Promise<TeamIteration> {
    if (!this.client) {
      throw new Error('Provider not initialized');
    }

    const teamName = team || this.config.team || this.config.project;
    const response = await this.client.post<TeamIteration>(`/${this.config.project}/${teamName}/_apis/work/teamsettings/iterations`, data);
    return response.data;
  }

  async deleteIteration(iterationId: string, team?: string): Promise<void> {
    if (!this.client) {
      throw new Error('Provider not initialized');
    }

    const teamName = team || this.config.team || this.config.project;
    await this.client.delete(`/${this.config.project}/${teamName}/_apis/work/teamsettings/iterations/${iterationId}`);
  }

  async getIterationCapacity(iterationId: string, team?: string): Promise<IterationCapacity[]> {
    if (!this.client) {
      throw new Error('Provider not initialized');
    }

    const teamName = team || this.config.team || this.config.project;
    const response = await this.client.get<{ value: IterationCapacity[] }>(`/${this.config.project}/${teamName}/_apis/work/teamsettings/iterations/${iterationId}/capacities`);
    return response.data.value || [];
  }

  async getIterationWorkItems(iterationId: string, team?: string): Promise<IterationWorkItems> {
    if (!this.client) {
      throw new Error('Provider not initialized');
    }

    const teamName = team || this.config.team || this.config.project;
    const response = await this.client.get<IterationWorkItems>(`/${this.config.project}/${teamName}/_apis/work/teamsettings/iterations/${iterationId}/workitems`);
    return response.data;
  }

  async listPullRequests(repositoryId: string, status?: string): Promise<PullRequestListResult> {
    if (!this.gitClient) {
      throw new Error('Git Provider not initialized');
    }

    const params: any = {};
    if (status) {
      params.searchCriteria = { status };
    }

    const url = `/git/repositories/${repositoryId}/pullrequests`;
    const fullUrl = `${this.gitClient.defaults.baseURL}${url}`;

    console.error(`[HTTP Provider] listPullRequests - Full URL: ${fullUrl}`);
    console.error(`[HTTP Provider] listPullRequests - Repository ID: ${repositoryId}`);
    console.error(`[HTTP Provider] listPullRequests - Status filter: ${status || 'none'}`);

    try {
      const response = await this.gitClient.get<{ value: PullRequest[] }>(url, { params });
      console.error(`[HTTP Provider] listPullRequests - SUCCESS: ${response.data.value?.length || 0} PRs found`);
      return {
        value: response.data.value || [],
        count: response.data.value?.length || 0
      };
    } catch (error: any) {
      console.error(`[HTTP Provider] listPullRequests - ERROR:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: fullUrl
      });
      throw error;
    }
  }

  async getPullRequest(repositoryId: string, pullRequestId: number): Promise<PullRequest> {
    if (!this.gitClient) {
      throw new Error('Git Provider not initialized');
    }

    const response = await this.gitClient.get<PullRequest>(`/git/repositories/${repositoryId}/pullrequests/${pullRequestId}`);
    return response.data;
  }

  async createPullRequest(repositoryId: string, data: CreatePullRequestPayload): Promise<PullRequest> {
    if (!this.gitClient) {
      throw new Error('Git Provider not initialized');
    }

    const url = `/git/repositories/${repositoryId}/pullrequests`;
    const fullUrl = `${this.gitClient.defaults.baseURL}${url}`;

    console.error(`[HTTP Provider] createPullRequest - Full URL: ${fullUrl}`);
    console.error(`[HTTP Provider] createPullRequest - Repository ID: ${repositoryId}`);
    console.error(`[HTTP Provider] createPullRequest - Title: ${data.title}`);
    console.error(`[HTTP Provider] createPullRequest - Source: ${data.sourceRefName} -> Target: ${data.targetRefName}`);

    try {
      const response = await this.gitClient.post<PullRequest>(url, data);
      console.error(`[HTTP Provider] createPullRequest - SUCCESS: PR #${response.data.pullRequestId} created`);
      return response.data;
    } catch (error: any) {
      console.error(`[HTTP Provider] createPullRequest - ERROR:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: fullUrl
      });
      throw error;
    }
  }

  async updatePullRequest(repositoryId: string, pullRequestId: number, data: UpdatePullRequestPayload): Promise<PullRequest> {
    if (!this.gitClient) {
      throw new Error('Git Provider not initialized');
    }

    const response = await this.gitClient.patch<PullRequest>(`/git/repositories/${repositoryId}/pullrequests/${pullRequestId}`, data);
    return response.data;
  }

  async mergePullRequest(repositoryId: string, pullRequestId: number, data: MergePullRequestPayload): Promise<PullRequest> {
    if (!this.gitClient) {
      throw new Error('Git Provider not initialized');
    }

    const mergeData = {
      ...data,
      status: 'completed'
    };

    const response = await this.gitClient.patch<PullRequest>(`/git/repositories/${repositoryId}/pullrequests/${pullRequestId}`, mergeData);
    return response.data;
  }

  async addPullRequestComment(repositoryId: string, pullRequestId: number, data: AddCommentPayload): Promise<PullRequestThread> {
    if (!this.gitClient) {
      throw new Error('Git Provider not initialized');
    }

    const thread = {
      comments: [{
        content: data.content,
        parentCommentId: data.parentCommentId
      }]
    };

    const response = await this.gitClient.post<PullRequestThread>(`/git/repositories/${repositoryId}/pullrequests/${pullRequestId}/threads`, thread);
    return response.data;
  }

  async addPullRequestReviewer(repositoryId: string, pullRequestId: number, data: AddReviewerPayload): Promise<PullRequest> {
    if (!this.gitClient) {
      throw new Error('Git Provider not initialized');
    }

    const response = await this.gitClient.put<PullRequest>(`/git/repositories/${repositoryId}/pullrequests/${pullRequestId}/reviewers/${data.id}`, {
      isRequired: data.isRequired || false
    });
    return response.data;
  }

  async votePullRequest(repositoryId: string, pullRequestId: number, reviewerId: string, data: PullRequestVotePayload): Promise<PullRequest> {
    if (!this.gitClient) {
      throw new Error('Git Provider not initialized');
    }

    const response = await this.gitClient.patch<PullRequest>(`/git/repositories/${repositoryId}/pullrequests/${pullRequestId}/reviewers/${reviewerId}`, data);
    return response.data;
  }

  async listRepositories(): Promise<RepositoriesListResult> {
    if (!this.gitClient) {
      throw new Error('Git Provider not initialized');
    }

    console.error(`[HTTP Provider] listRepositories - Fetching repositories for project: ${this.config.project}`);

    try {
      const response = await this.gitClient.get<{ value: GitRepository[] }>(`/git/repositories`);
      console.error(`[HTTP Provider] listRepositories - SUCCESS: ${response.data.value?.length || 0} repositories found`);
      return {
        value: response.data.value || [],
        count: response.data.value?.length || 0
      };
    } catch (error: any) {
      console.error(`[HTTP Provider] listRepositories - ERROR:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      throw error;
    }
  }

  async getRepository(repositoryId: string): Promise<GitRepository> {
    if (!this.gitClient) {
      throw new Error('Git Provider not initialized');
    }

    console.error(`[HTTP Provider] getRepository - Repository ID: ${repositoryId}`);

    try {
      const response = await this.gitClient.get<GitRepository>(`/git/repositories/${repositoryId}`);
      console.error(`[HTTP Provider] getRepository - SUCCESS: ${response.data.name}`);
      return response.data;
    } catch (error: any) {
      console.error(`[HTTP Provider] getRepository - ERROR:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      throw error;
    }
  }

  async listTeams(): Promise<TeamsListResult> {
    if (!this.client) {
      throw new Error('Provider not initialized');
    }

    const response = await this.client.get<{ value: Team[] }>(`/_apis/projects/${this.config.project}/teams`);
    return {
      value: response.data.value || [],
      count: response.data.value?.length || 0
    };
  }

  async getTeam(teamId: string): Promise<Team> {
    if (!this.client) {
      throw new Error('Provider not initialized');
    }

    const response = await this.client.get<Team>(`/_apis/projects/${this.config.project}/teams/${teamId}`);
    return response.data;
  }

  async createTeam(data: CreateTeamPayload): Promise<Team> {
    if (!this.client) {
      throw new Error('Provider not initialized');
    }

    const response = await this.client.post<Team>(`/_apis/projects/${this.config.project}/teams`, data);
    return response.data;
  }

  async updateTeam(teamId: string, data: UpdateTeamPayload): Promise<Team> {
    if (!this.client) {
      throw new Error('Provider not initialized');
    }

    const response = await this.client.patch<Team>(`/_apis/projects/${this.config.project}/teams/${teamId}`, data);
    return response.data;
  }

  async deleteTeam(teamId: string): Promise<void> {
    if (!this.client) {
      throw new Error('Provider not initialized');
    }

    await this.client.delete(`/_apis/projects/${this.config.project}/teams/${teamId}`);
  }

  async listTeamMembers(teamId: string): Promise<TeamMembersResult> {
    if (!this.client) {
      throw new Error('Provider not initialized');
    }

    const response = await this.client.get<{ value: TeamMember[] }>(`/_apis/projects/${this.config.project}/teams/${teamId}/members`);
    return {
      value: response.data.value || [],
      count: response.data.value?.length || 0
    };
  }

  async addTeamMember(teamId: string, data: AddTeamMemberPayload): Promise<TeamMember> {
    if (!this.client) {
      throw new Error('Provider not initialized');
    }

    const response = await this.client.put<TeamMember>(`/_apis/projects/${this.config.project}/teams/${teamId}/members/${data.userId}`, {});
    return response.data;
  }

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    if (!this.client) {
      throw new Error('Provider not initialized');
    }

    await this.client.delete(`/_apis/projects/${this.config.project}/teams/${teamId}/members/${userId}`);
  }

  async listWikis(): Promise<WikisListResult> {
    if (!this.gitClient) {
      throw new Error('Git Provider not initialized');
    }

    const response = await this.gitClient.get<{ value: Wiki[] }>(`/wiki/wikis`);
    return {
      value: response.data.value || [],
      count: response.data.value?.length || 0
    };
  }

  async getWiki(wikiIdentifier: string): Promise<Wiki> {
    if (!this.gitClient) {
      throw new Error('Git Provider not initialized');
    }

    const response = await this.gitClient.get<Wiki>(`/wiki/wikis/${wikiIdentifier}`);
    return response.data;
  }

  async createWiki(data: CreateWikiPayload): Promise<Wiki> {
    if (!this.gitClient) {
      throw new Error('Git Provider not initialized');
    }

    const response = await this.gitClient.post<Wiki>(`/wiki/wikis`, data);
    return response.data;
  }

  async deleteWiki(wikiIdentifier: string): Promise<void> {
    if (!this.gitClient) {
      throw new Error('Git Provider not initialized');
    }

    await this.gitClient.delete(`/wiki/wikis/${wikiIdentifier}`);
  }

  async listWikiPages(wikiIdentifier: string, path?: string): Promise<WikiPagesListResult> {
    if (!this.gitClient) {
      throw new Error('Git Provider not initialized');
    }

    const params: any = { recursionLevel: 'full' };
    if (path) {
      params.path = path;
    }

    const response = await this.gitClient.get<{ value: WikiPage[] }>(`/wiki/wikis/${wikiIdentifier}/pages`, { params });
    return {
      value: response.data.value || [],
      count: response.data.value?.length || 0
    };
  }

  async getWikiPage(wikiIdentifier: string, path: string, includeContent?: boolean): Promise<WikiPage> {
    if (!this.gitClient) {
      throw new Error('Git Provider not initialized');
    }

    const params: any = { path };
    if (includeContent !== undefined) {
      params.includeContent = includeContent;
    }

    const response = await this.gitClient.get<WikiPage>(`/wiki/wikis/${wikiIdentifier}/pages`, { params });
    return response.data;
  }

  async createWikiPage(wikiIdentifier: string, path: string, data: CreateWikiPagePayload): Promise<WikiPage> {
    if (!this.gitClient) {
      throw new Error('Git Provider not initialized');
    }

    const response = await this.gitClient.put<WikiPage>(`/wiki/wikis/${wikiIdentifier}/pages`, data, {
      params: { path }
    });
    return response.data;
  }

  async updateWikiPage(wikiIdentifier: string, path: string, data: UpdateWikiPagePayload): Promise<WikiPage> {
    if (!this.gitClient) {
      throw new Error('Git Provider not initialized');
    }

    const response = await this.gitClient.put<WikiPage>(`/wiki/wikis/${wikiIdentifier}/pages`, data, {
      params: { path }
    });
    return response.data;
  }

  async deleteWikiPage(wikiIdentifier: string, path: string): Promise<void> {
    if (!this.gitClient) {
      throw new Error('Git Provider not initialized');
    }

    await this.gitClient.delete(`/wiki/wikis/${wikiIdentifier}/pages`, {
      params: { path }
    });
  }
}

