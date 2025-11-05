import { IProvider, TeamIteration, IterationCapacity, IterationWorkItems, CreateIterationPayload } from '../types';
import { RetryPolicy, CircuitBreaker } from '../core/resilience';
import { RateLimiter } from '../core/rules';
import { logRequest, logResponse, logError } from '../logging/logger';
import { TelemetryCollector } from '../logging/telemetry';

export class IterationsAPI {
  private provider: IProvider;
  private retryPolicy: RetryPolicy;
  private circuitBreaker: CircuitBreaker;
  private rateLimiter: RateLimiter;
  private telemetry: TelemetryCollector;
  private getHttpFallback?: () => Promise<IProvider>;

  constructor(
    provider: IProvider,
    retryPolicy: RetryPolicy,
    circuitBreaker: CircuitBreaker,
    rateLimiter: RateLimiter,
    telemetry: TelemetryCollector,
    getHttpFallback?: () => Promise<IProvider>
  ) {
    this.provider = provider;
    this.retryPolicy = retryPolicy;
    this.circuitBreaker = circuitBreaker;
    this.rateLimiter = rateLimiter;
    this.telemetry = telemetry;
    this.getHttpFallback = getHttpFallback;
  }

  async list(team?: string): Promise<TeamIteration[]> {
    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('listIterations', team || 'default-team');

    try {
      const result = await this.executeWithResilience(
        () => this.provider.listIterations(team)
      );

      const duration = Date.now() - startTime;
      logResponse('listIterations', team || 'default-team', duration);
      
      this.telemetry.recordRequest({
        method: 'listIterations',
        success: true,
        duration,
        provider: this.getProviderType()
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'listIterations', team });
      this.telemetry.recordError(err, { method: 'listIterations' });
      throw err;
    }
  }

  async get(iterationId: string, team?: string): Promise<TeamIteration> {
    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('getIteration', iterationId);

    try {
      const result = await this.executeWithResilience(
        () => this.provider.getIteration(iterationId, team)
      );

      const duration = Date.now() - startTime;
      logResponse('getIteration', iterationId, duration);
      
      this.telemetry.recordRequest({
        method: 'getIteration',
        success: true,
        duration,
        provider: this.getProviderType()
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'getIteration', iterationId });
      this.telemetry.recordError(err, { method: 'getIteration' });
      throw err;
    }
  }

  async create(data: CreateIterationPayload, team?: string): Promise<TeamIteration> {
    if (!data || !data.name) {
      throw new Error('Iteration name is required');
    }

    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('createIteration', data.name);

    try {
      const result = await this.executeWithResilience(
        () => this.provider.createIteration(data, team)
      );

      const duration = Date.now() - startTime;
      logResponse('createIteration', data.name, duration);
      
      this.telemetry.recordRequest({
        method: 'createIteration',
        success: true,
        duration,
        provider: this.getProviderType()
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      
      if (err.message.includes('not supported via SDK') && this.getHttpFallback) {
        logRequest('createIteration', `${data.name} (HTTP fallback)`);
        
        try {
          const httpProvider = await this.getHttpFallback();
          const result = await this.executeWithResilience(
            () => httpProvider.createIteration(data, team)
          );

          const duration = Date.now() - startTime;
          logResponse('createIteration', `${data.name} (HTTP)`, duration);
          
          this.telemetry.recordRequest({
            method: 'createIteration',
            success: true,
            duration,
            provider: 'http'
          });

          return result;
        } catch (httpError) {
          const httpErr = httpError instanceof Error ? httpError : new Error('Unknown error');
          logError(httpErr, { method: 'createIteration (HTTP fallback)', data });
          this.telemetry.recordError(httpErr, { method: 'createIteration' });
          throw httpErr;
        }
      }
      
      logError(err, { method: 'createIteration', data });
      this.telemetry.recordError(err, { method: 'createIteration' });
      throw err;
    }
  }

  async delete(iterationId: string, team?: string): Promise<void> {
    if (!iterationId) {
      throw new Error('Iteration ID is required');
    }

    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('deleteIteration', iterationId);

    try {
      await this.executeWithResilience(
        () => this.provider.deleteIteration(iterationId, team)
      );

      const duration = Date.now() - startTime;
      logResponse('deleteIteration', iterationId, duration);
      
      this.telemetry.recordRequest({
        method: 'deleteIteration',
        success: true,
        duration,
        provider: this.getProviderType()
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      
      if (err.message.includes('not supported via SDK') && this.getHttpFallback) {
        logRequest('deleteIteration', `${iterationId} (HTTP fallback)`);
        
        try {
          const httpProvider = await this.getHttpFallback();
          await this.executeWithResilience(
            () => httpProvider.deleteIteration(iterationId, team)
          );

          const duration = Date.now() - startTime;
          logResponse('deleteIteration', `${iterationId} (HTTP)`, duration);
          
          this.telemetry.recordRequest({
            method: 'deleteIteration',
            success: true,
            duration,
            provider: 'http'
          });
          
          return;
        } catch (httpError) {
          const httpErr = httpError instanceof Error ? httpError : new Error('Unknown error');
          logError(httpErr, { method: 'deleteIteration (HTTP fallback)', iterationId });
          this.telemetry.recordError(httpErr, { method: 'deleteIteration' });
          throw httpErr;
        }
      }
      
      logError(err, { method: 'deleteIteration', iterationId });
      this.telemetry.recordError(err, { method: 'deleteIteration' });
      throw err;
    }
  }

  async getCapacity(iterationId: string, team?: string): Promise<IterationCapacity[]> {
    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('getIterationCapacity', iterationId);

    try {
      const result = await this.executeWithResilience(
        () => this.provider.getIterationCapacity(iterationId, team)
      );

      const duration = Date.now() - startTime;
      logResponse('getIterationCapacity', iterationId, duration);
      
      this.telemetry.recordRequest({
        method: 'getIterationCapacity',
        success: true,
        duration,
        provider: this.getProviderType()
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      
      if (err.message.includes('not supported via SDK') && this.getHttpFallback) {
        logRequest('getIterationCapacity', `${iterationId} (HTTP fallback)`);
        
        try {
          const httpProvider = await this.getHttpFallback();
          const result = await this.executeWithResilience(
            () => httpProvider.getIterationCapacity(iterationId, team)
          );

          const duration = Date.now() - startTime;
          logResponse('getIterationCapacity', `${iterationId} (HTTP)`, duration);
          
          this.telemetry.recordRequest({
            method: 'getIterationCapacity',
            success: true,
            duration,
            provider: 'http'
          });

          return result;
        } catch (httpError) {
          const httpErr = httpError instanceof Error ? httpError : new Error('Unknown error');
          logError(httpErr, { method: 'getIterationCapacity (HTTP fallback)', iterationId });
          this.telemetry.recordError(httpErr, { method: 'getIterationCapacity' });
          throw httpErr;
        }
      }
      
      logError(err, { method: 'getIterationCapacity', iterationId });
      this.telemetry.recordError(err, { method: 'getIterationCapacity' });
      throw err;
    }
  }

  async getWorkItems(iterationId: string, team?: string): Promise<IterationWorkItems> {
    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('getIterationWorkItems', iterationId);

    try {
      const result = await this.executeWithResilience(
        () => this.provider.getIterationWorkItems(iterationId, team)
      );

      const duration = Date.now() - startTime;
      logResponse('getIterationWorkItems', iterationId, duration);
      
      this.telemetry.recordRequest({
        method: 'getIterationWorkItems',
        success: true,
        duration,
        provider: this.getProviderType()
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'getIterationWorkItems', iterationId });
      this.telemetry.recordError(err, { method: 'getIterationWorkItems' });
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

