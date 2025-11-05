import * as azdev from 'azure-devops-node-api';
import { IWorkItemTrackingApi } from 'azure-devops-node-api/WorkItemTrackingApi';
import { JsonPatchOperation as SdkJsonPatchOperation } from 'azure-devops-node-api/interfaces/common/VSSInterfaces';
import { Wiql } from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces';
import { BaseProvider } from './base.provider';
import { WorkItem, CreateWorkItemPayload, UpdateWorkItemPayload, WorkItemFields, WiqlQuery, WiqlResult, Board, BoardsListResult, BoardSettings, TeamIteration, IterationCapacity, IterationWorkItems, CreateIterationPayload, PullRequest, PullRequestListResult, CreatePullRequestPayload, UpdatePullRequestPayload, MergePullRequestPayload, AddCommentPayload, AddReviewerPayload, PullRequestVotePayload, PullRequestThread, GitRepository, RepositoriesListResult, Team, TeamsListResult, TeamMember, TeamMembersResult, CreateTeamPayload, UpdateTeamPayload, AddTeamMemberPayload } from '../types';

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

  async listIterations(team?: string): Promise<TeamIteration[]> {
    if (!this.connection) {
      throw new Error('Provider not initialized');
    }

    const workApi = await this.connection.getWorkApi();
    const teamContext = { 
      project: this.config.project,
      team: team || this.config.team || this.config.project
    };
    
    const iterations = await workApi.getTeamIterations(teamContext);
    
    if (!iterations) {
      return [];
    }

    return iterations.map(iter => ({
      id: iter.id || '',
      name: iter.name || '',
      path: iter.path || '',
      url: iter.url || '',
      attributes: {
        startDate: iter.attributes?.startDate?.toISOString() || '',
        finishDate: iter.attributes?.finishDate?.toISOString() || '',
        timeFrame: ((iter.attributes?.timeFrame?.toString() as 'past' | 'current' | 'future') || 'future')
      },
      teamId: team
    }));
  }

  async getIteration(iterationId: string, team?: string): Promise<TeamIteration> {
    if (!this.connection) {
      throw new Error('Provider not initialized');
    }

    const workApi = await this.connection.getWorkApi();
    const teamContext = { 
      project: this.config.project,
      team: team || this.config.team || this.config.project
    };
    
    const iteration = await workApi.getTeamIteration(teamContext, iterationId);
    
    if (!iteration) {
      throw new Error(`Iteration ${iterationId} not found`);
    }

    return {
      id: iteration.id || '',
      name: iteration.name || '',
      path: iteration.path || '',
      url: iteration.url || '',
      attributes: {
        startDate: iteration.attributes?.startDate?.toISOString() || '',
        finishDate: iteration.attributes?.finishDate?.toISOString() || '',
        timeFrame: ((iteration.attributes?.timeFrame?.toString() as 'past' | 'current' | 'future') || 'future')
      },
      teamId: team
    };
  }

  async createIteration(_data: CreateIterationPayload, _team?: string): Promise<TeamIteration> {
    throw new Error('Create iteration not supported via SDK - use HTTP provider or Azure DevOps portal');
  }

  async deleteIteration(_iterationId: string, _team?: string): Promise<void> {
    throw new Error('Delete iteration not supported via SDK - use HTTP provider or Azure DevOps portal');
  }

  async getIterationCapacity(_iterationId: string, _team?: string): Promise<IterationCapacity[]> {
    throw new Error('Iteration capacity not fully supported via SDK - use HTTP provider');
  }

  async getIterationWorkItems(iterationId: string, team?: string): Promise<IterationWorkItems> {
    if (!this.connection) {
      throw new Error('Provider not initialized');
    }

    const workApi = await this.connection.getWorkApi();
    const teamContext = { 
      project: this.config.project,
      team: team || this.config.team || this.config.project
    };
    
    const workItems = await workApi.getIterationWorkItems(teamContext, iterationId);
    
    if (!workItems || !workItems.workItemRelations) {
      return {
        workItemRelations: [],
        url: ''
      };
    }

    return {
      workItemRelations: workItems.workItemRelations.map((rel: any) => ({
        target: {
          id: rel.target?.id || 0,
          url: rel.target?.url || ''
        },
        rel: rel.rel || ''
      })),
      url: workItems.url || ''
    };
  }

  async listPullRequests(_repositoryId: string, _status?: string): Promise<PullRequestListResult> {
    throw new Error('Pull Requests API not implemented in SDK Provider - use HTTP provider');
  }

  async getPullRequest(_repositoryId: string, _pullRequestId: number): Promise<PullRequest> {
    throw new Error('Pull Requests API not implemented in SDK Provider - use HTTP provider');
  }

  async createPullRequest(_repositoryId: string, _data: CreatePullRequestPayload): Promise<PullRequest> {
    throw new Error('Pull Requests API not implemented in SDK Provider - use HTTP provider');
  }

  async updatePullRequest(_repositoryId: string, _pullRequestId: number, _data: UpdatePullRequestPayload): Promise<PullRequest> {
    throw new Error('Pull Requests API not implemented in SDK Provider - use HTTP provider');
  }

  async mergePullRequest(_repositoryId: string, _pullRequestId: number, _data: MergePullRequestPayload): Promise<PullRequest> {
    throw new Error('Pull Requests API not implemented in SDK Provider - use HTTP provider');
  }

  async addPullRequestComment(_repositoryId: string, _pullRequestId: number, _data: AddCommentPayload): Promise<PullRequestThread> {
    throw new Error('Pull Requests API not implemented in SDK Provider - use HTTP provider');
  }

  async addPullRequestReviewer(_repositoryId: string, _pullRequestId: number, _data: AddReviewerPayload): Promise<PullRequest> {
    throw new Error('Pull Requests API not implemented in SDK Provider - use HTTP provider');
  }

  async votePullRequest(_repositoryId: string, _pullRequestId: number, _reviewerId: string, _data: PullRequestVotePayload): Promise<PullRequest> {
    throw new Error('Pull Requests API not implemented in SDK Provider - use HTTP provider');
  }

  async listRepositories(): Promise<RepositoriesListResult> {
    if (!this.connection) {
      throw new Error('Provider not initialized');
    }

    const gitApi = await this.connection.getGitApi();
    const repositories = await gitApi.getRepositories(this.config.project);

    if (!repositories) {
      return { value: [], count: 0 };
    }

    return {
      value: repositories.map(repo => ({
        id: repo.id || '',
        name: repo.name || '',
        url: repo.url || '',
        project: {
          id: repo.project?.id || '',
          name: repo.project?.name || this.config.project
        },
        defaultBranch: repo.defaultBranch,
        size: repo.size,
        remoteUrl: repo.remoteUrl,
        sshUrl: repo.sshUrl,
        webUrl: repo.webUrl
      })),
      count: repositories.length
    };
  }

  async getRepository(repositoryId: string): Promise<GitRepository> {
    if (!this.connection) {
      throw new Error('Provider not initialized');
    }

    const gitApi = await this.connection.getGitApi();
    const repo = await gitApi.getRepository(repositoryId, this.config.project);

    if (!repo) {
      throw new Error(`Repository ${repositoryId} not found`);
    }

    return {
      id: repo.id || '',
      name: repo.name || '',
      url: repo.url || '',
      project: {
        id: repo.project?.id || '',
        name: repo.project?.name || this.config.project
      },
      defaultBranch: repo.defaultBranch,
      size: repo.size,
      remoteUrl: repo.remoteUrl,
      sshUrl: repo.sshUrl,
      webUrl: repo.webUrl
    };
  }

  async listTeams(): Promise<TeamsListResult> {
    if (!this.connection) {
      throw new Error('Provider not initialized');
    }

    const coreApi = await this.connection.getCoreApi();
    const teams = await coreApi.getTeams(this.config.project);

    if (!teams) {
      return { value: [], count: 0 };
    }

    return {
      value: teams.map(team => ({
        id: team.id || '',
        name: team.name || '',
        url: team.url || '',
        description: team.description,
        projectId: team.projectId,
        projectName: team.projectName
      })),
      count: teams.length
    };
  }

  async getTeam(teamId: string): Promise<Team> {
    if (!this.connection) {
      throw new Error('Provider not initialized');
    }

    const coreApi = await this.connection.getCoreApi();
    const team = await coreApi.getTeam(this.config.project, teamId);

    if (!team) {
      throw new Error(`Team ${teamId} not found`);
    }

    return {
      id: team.id || '',
      name: team.name || '',
      url: team.url || '',
      description: team.description,
      projectId: team.projectId,
      projectName: team.projectName
    };
  }

  async createTeam(data: CreateTeamPayload): Promise<Team> {
    if (!this.connection) {
      throw new Error('Provider not initialized');
    }

    const coreApi = await this.connection.getCoreApi();
    const team = await coreApi.createTeam({ name: data.name, description: data.description }, this.config.project);

    if (!team) {
      throw new Error('Failed to create team');
    }

    return {
      id: team.id || '',
      name: team.name || '',
      url: team.url || '',
      description: team.description,
      projectId: team.projectId,
      projectName: team.projectName
    };
  }

  async updateTeam(teamId: string, data: UpdateTeamPayload): Promise<Team> {
    if (!this.connection) {
      throw new Error('Provider not initialized');
    }

    const coreApi = await this.connection.getCoreApi();
    const team = await coreApi.updateTeam({ name: data.name, description: data.description }, this.config.project, teamId);

    if (!team) {
      throw new Error('Failed to update team');
    }

    return {
      id: team.id || '',
      name: team.name || '',
      url: team.url || '',
      description: team.description,
      projectId: team.projectId,
      projectName: team.projectName
    };
  }

  async deleteTeam(_teamId: string): Promise<void> {
    throw new Error('Delete team not supported via SDK - use HTTP provider or Azure DevOps portal');
  }

  async listTeamMembers(teamId: string): Promise<TeamMembersResult> {
    if (!this.connection) {
      throw new Error('Provider not initialized');
    }

    const coreApi = await this.connection.getCoreApi();
    const members = await coreApi.getTeamMembersWithExtendedProperties(this.config.project, teamId);

    if (!members) {
      return { value: [], count: 0 };
    }

    return {
      value: members.map((member: any) => ({
        identity: {
          id: member.identity?.id || '',
          displayName: member.identity?.displayName || '',
          uniqueName: member.identity?.uniqueName || '',
          imageUrl: member.identity?.imageUrl
        },
        isTeamAdmin: member.isTeamAdmin || false
      })),
      count: members.length
    };
  }

  async addTeamMember(_teamId: string, _data: AddTeamMemberPayload): Promise<TeamMember> {
    throw new Error('Add team member not supported via SDK - use HTTP provider');
  }

  async removeTeamMember(_teamId: string, _userId: string): Promise<void> {
    throw new Error('Remove team member not supported via SDK - use HTTP provider');
  }

  async listWikis(): Promise<import('../types/wiki').WikisListResult> {
    throw new Error('List wikis not implemented in SDK Provider - use HTTP provider');
  }

  async getWiki(_wikiIdentifier: string): Promise<import('../types/wiki').Wiki> {
    throw new Error('Get wiki not implemented in SDK Provider - use HTTP provider');
  }

  async createWiki(_data: import('../types/wiki').CreateWikiPayload): Promise<import('../types/wiki').Wiki> {
    throw new Error('Create wiki not implemented in SDK Provider - use HTTP provider');
  }

  async deleteWiki(_wikiIdentifier: string): Promise<void> {
    throw new Error('Delete wiki not implemented in SDK Provider - use HTTP provider');
  }

  async listWikiPages(_wikiIdentifier: string, _path?: string): Promise<import('../types/wiki').WikiPagesListResult> {
    throw new Error('List wiki pages not implemented in SDK Provider - use HTTP provider');
  }

  async getWikiPage(_wikiIdentifier: string, _path: string, _includeContent?: boolean): Promise<import('../types/wiki').WikiPage> {
    throw new Error('Get wiki page not implemented in SDK Provider - use HTTP provider');
  }

  async createWikiPage(_wikiIdentifier: string, _path: string, _data: import('../types/wiki').CreateWikiPagePayload): Promise<import('../types/wiki').WikiPage> {
    throw new Error('Create wiki page not implemented in SDK Provider - use HTTP provider');
  }

  async updateWikiPage(_wikiIdentifier: string, _path: string, _data: import('../types/wiki').UpdateWikiPagePayload): Promise<import('../types/wiki').WikiPage> {
    throw new Error('Update wiki page not implemented in SDK Provider - use HTTP provider');
  }

  async deleteWikiPage(_wikiIdentifier: string, _path: string): Promise<void> {
    throw new Error('Delete wiki page not implemented in SDK Provider - use HTTP provider');
  }
}

