import { IProvider, Team, TeamsListResult, TeamMember, TeamMembersResult, CreateTeamPayload, UpdateTeamPayload, AddTeamMemberPayload } from '../types';
import { RetryPolicy, CircuitBreaker } from '../core/resilience';
import { RateLimiter } from '../core/rules';
import { logRequest, logResponse, logError } from '../logging/logger';
import { TelemetryCollector } from '../logging/telemetry';

export class TeamsAPI {
  private provider: IProvider;
  private retryPolicy: RetryPolicy;
  private circuitBreaker: CircuitBreaker;
  private rateLimiter: RateLimiter;
  private telemetry: TelemetryCollector;

  constructor(
    provider: IProvider,
    retryPolicy: RetryPolicy,
    circuitBreaker: CircuitBreaker,
    rateLimiter: RateLimiter,
    telemetry: TelemetryCollector
  ) {
    this.provider = provider;
    this.retryPolicy = retryPolicy;
    this.circuitBreaker = circuitBreaker;
    this.rateLimiter = rateLimiter;
    this.telemetry = telemetry;
  }

  async list(): Promise<TeamsListResult> {
    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('listTeams', 'all');

    try {
      const result = await this.executeWithResilience(
        () => this.provider.listTeams()
      );

      const duration = Date.now() - startTime;
      logResponse('listTeams', 'all', duration);
      
      this.telemetry.recordRequest({
        method: 'listTeams',
        success: true,
        duration,
        provider: this.getProviderType()
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'listTeams' });
      this.telemetry.recordError(err, { method: 'listTeams' });
      throw err;
    }
  }

  async get(teamId: string): Promise<Team> {
    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('getTeam', teamId);

    try {
      const result = await this.executeWithResilience(
        () => this.provider.getTeam(teamId)
      );

      const duration = Date.now() - startTime;
      logResponse('getTeam', teamId, duration);
      
      this.telemetry.recordRequest({
        method: 'getTeam',
        success: true,
        duration,
        provider: this.getProviderType()
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'getTeam', teamId });
      this.telemetry.recordError(err, { method: 'getTeam' });
      throw err;
    }
  }

  async create(data: CreateTeamPayload): Promise<Team> {
    if (!data || !data.name) {
      throw new Error('Team name is required');
    }

    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('createTeam', data.name);

    try {
      const result = await this.executeWithResilience(
        () => this.provider.createTeam(data)
      );

      const duration = Date.now() - startTime;
      logResponse('createTeam', data.name, duration);
      
      this.telemetry.recordRequest({
        method: 'createTeam',
        success: true,
        duration,
        provider: this.getProviderType()
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'createTeam', data });
      this.telemetry.recordError(err, { method: 'createTeam' });
      throw err;
    }
  }

  async update(teamId: string, data: UpdateTeamPayload): Promise<Team> {
    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('updateTeam', teamId);

    try {
      const result = await this.executeWithResilience(
        () => this.provider.updateTeam(teamId, data)
      );

      const duration = Date.now() - startTime;
      logResponse('updateTeam', teamId, duration);
      
      this.telemetry.recordRequest({
        method: 'updateTeam',
        success: true,
        duration,
        provider: this.getProviderType()
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'updateTeam', teamId });
      this.telemetry.recordError(err, { method: 'updateTeam' });
      throw err;
    }
  }

  async delete(teamId: string): Promise<void> {
    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('deleteTeam', teamId);

    try {
      await this.executeWithResilience(
        () => this.provider.deleteTeam(teamId)
      );

      const duration = Date.now() - startTime;
      logResponse('deleteTeam', teamId, duration);
      
      this.telemetry.recordRequest({
        method: 'deleteTeam',
        success: true,
        duration,
        provider: this.getProviderType()
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'deleteTeam', teamId });
      this.telemetry.recordError(err, { method: 'deleteTeam' });
      throw err;
    }
  }

  async listMembers(teamId: string): Promise<TeamMembersResult> {
    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('listTeamMembers', teamId);

    try {
      const result = await this.executeWithResilience(
        () => this.provider.listTeamMembers(teamId)
      );

      const duration = Date.now() - startTime;
      logResponse('listTeamMembers', teamId, duration);
      
      this.telemetry.recordRequest({
        method: 'listTeamMembers',
        success: true,
        duration,
        provider: this.getProviderType()
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'listTeamMembers', teamId });
      this.telemetry.recordError(err, { method: 'listTeamMembers' });
      throw err;
    }
  }

  async addMember(teamId: string, data: AddTeamMemberPayload): Promise<TeamMember> {
    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('addTeamMember', teamId);

    try {
      const result = await this.executeWithResilience(
        () => this.provider.addTeamMember(teamId, data)
      );

      const duration = Date.now() - startTime;
      logResponse('addTeamMember', teamId, duration);
      
      this.telemetry.recordRequest({
        method: 'addTeamMember',
        success: true,
        duration,
        provider: this.getProviderType()
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'addTeamMember', teamId });
      this.telemetry.recordError(err, { method: 'addTeamMember' });
      throw err;
    }
  }

  async removeMember(teamId: string, userId: string): Promise<void> {
    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('removeTeamMember', teamId);

    try {
      await this.executeWithResilience(
        () => this.provider.removeTeamMember(teamId, userId)
      );

      const duration = Date.now() - startTime;
      logResponse('removeTeamMember', teamId, duration);
      
      this.telemetry.recordRequest({
        method: 'removeTeamMember',
        success: true,
        duration,
        provider: this.getProviderType()
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'removeTeamMember', teamId });
      this.telemetry.recordError(err, { method: 'removeTeamMember' });
      throw err;
    }
  }

  private async executeWithResilience<T>(fn: () => Promise<T>): Promise<T> {
    return this.circuitBreaker.execute(
      () => this.retryPolicy.execute(fn)
    );
  }

  private getProviderType(): string {
    return this.provider.constructor.name;
  }
}

