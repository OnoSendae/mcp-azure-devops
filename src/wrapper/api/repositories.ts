import { IProvider } from '../types/providers';
import { GitRepository, RepositoriesListResult } from '../types/pull-requests';
import { RetryPolicy, CircuitBreaker } from '../core/resilience';
import { RateLimiter } from '../core/rules';
import { logRequest, logResponse, logError } from '../logging/logger';
import { TelemetryCollector } from '../logging/telemetry';

export class RepositoriesAPI {
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

  async list(): Promise<RepositoriesListResult> {
    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('listRepositories', 'all');

    try {
      const result = await this.executeWithResilience(
        () => this.provider.listRepositories()
      );

      const duration = Date.now() - startTime;
      logResponse('listRepositories', 'all', duration);
      
      this.telemetry.recordRequest({
        method: 'listRepositories',
        success: true,
        duration,
        provider: this.getProviderType()
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'listRepositories' });
      this.telemetry.recordError(err, { method: 'listRepositories' });
      throw err;
    }
  }

  async get(repositoryId: string): Promise<GitRepository> {
    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('getRepository', repositoryId);

    try {
      const result = await this.executeWithResilience(
        () => this.provider.getRepository(repositoryId)
      );

      const duration = Date.now() - startTime;
      logResponse('getRepository', repositoryId, duration);
      
      this.telemetry.recordRequest({
        method: 'getRepository',
        success: true,
        duration,
        provider: this.getProviderType()
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'getRepository', repositoryId });
      this.telemetry.recordError(err, { method: 'getRepository' });
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

