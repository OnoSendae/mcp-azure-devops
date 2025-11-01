import { IProvider, WiqlQuery, WiqlResult, WiqlQueryOptions, WorkItem } from '../types';
import { RetryPolicy, CircuitBreaker } from '../core/resilience';
import { RateLimiter } from '../core/rules';
import { logRequest, logResponse, logError } from '../logging/logger';
import { TelemetryCollector } from '../logging/telemetry';
import { WorkItemsAPI } from './work-items';

export class WiqlAPI {
  private provider: IProvider;
  private retryPolicy: RetryPolicy;
  private circuitBreaker: CircuitBreaker;
  private rateLimiter: RateLimiter;
  private telemetry: TelemetryCollector;
  private workItemsAPI?: WorkItemsAPI;

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

  setWorkItemsAPI(workItemsAPI: WorkItemsAPI): void {
    this.workItemsAPI = workItemsAPI;
  }

  async query(queryString: string, options?: WiqlQueryOptions): Promise<WiqlResult> {
    this.validateQuery(queryString);

    const wiqlQuery: WiqlQuery = {
      query: queryString,
      top: options?.top,
      timePrecision: options?.timePrecision
    };

    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('executeWiql', 'query', { queryLength: queryString.length });

    try {
      const result = await this.executeWithResilience(
        () => this.provider.executeWiql(wiqlQuery)
      );

      const duration = Date.now() - startTime;
      logResponse('executeWiql', 'query', duration, { resultCount: result.workItems.length });
      
      this.telemetry.recordRequest({
        method: 'executeWiql',
        success: true,
        duration,
        provider: this.getProviderType()
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'executeWiql', queryString });
      this.telemetry.recordError(err, { method: 'executeWiql' });
      throw err;
    }
  }

  async queryAndGet(
    queryString: string,
    fields?: string[],
    options?: WiqlQueryOptions
  ): Promise<WorkItem[]> {
    if (!this.workItemsAPI) {
      throw new Error('WorkItemsAPI not set. Call setWorkItemsAPI() first');
    }

    const result = await this.query(queryString, options);
    
    if (result.workItems.length === 0) {
      return [];
    }

    const ids = result.workItems.map(wi => wi.id);
    return this.workItemsAPI.getBatch(ids, fields);
  }

  private validateQuery(queryString: string): void {
    if (!queryString || queryString.trim().length === 0) {
      throw new Error('Query string cannot be empty');
    }

    const upperQuery = queryString.toUpperCase();
    
    if (!upperQuery.includes('SELECT')) {
      throw new Error('Query must contain SELECT clause');
    }

    if (!upperQuery.includes('FROM')) {
      throw new Error('Query must contain FROM clause');
    }
  }

  private async executeWithResilience<T>(fn: () => Promise<T>): Promise<T> {
    return this.circuitBreaker.execute(
      () => this.retryPolicy.execute(fn)
    );
  }

  private getProviderType(): string {
    return this.provider.constructor.name.replace('Provider', '').toLowerCase();
  }
}

