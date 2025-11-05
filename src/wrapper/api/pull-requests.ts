import { IProvider, PullRequest, PullRequestListResult, CreatePullRequestPayload, UpdatePullRequestPayload, MergePullRequestPayload, AddCommentPayload, AddReviewerPayload, PullRequestVotePayload, PullRequestThread } from '../types';
import { RetryPolicy, CircuitBreaker } from '../core/resilience';
import { RateLimiter } from '../core/rules';
import { logRequest, logResponse, logError } from '../logging/logger';
import { TelemetryCollector } from '../logging/telemetry';

export class PullRequestsAPI {
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

  private async tryWithHttpFallback<T>(
    method: string,
    operation: (provider: IProvider) => Promise<T>,
    context: string
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      logRequest(method, `${context} (trying SDK Provider)`);
      return await this.executeWithResilience(() => operation(this.provider));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      
      logError(err, { 
        method, 
        context, 
        provider: 'SDK',
        message: err.message,
        willTryHttpFallback: err.message.includes('not implemented') && !!this.getHttpFallback
      });
      
      if (err.message.includes('not implemented') && this.getHttpFallback) {
        logRequest(method, `${context} (HTTP FALLBACK ACTIVATED)`);
        
        try {
          const httpProvider = await this.getHttpFallback();
          logRequest(method, `${context} (HTTP Provider initialized)`);
          
          const result = await this.executeWithResilience(() => operation(httpProvider));
          
          const duration = Date.now() - startTime;
          logResponse(method, `${context} (HTTP fallback SUCCESS)`, duration);
          
          this.telemetry.recordRequest({
            method,
            success: true,
            duration,
            provider: 'http',
            fallbackUsed: true
          });
          
          return result;
        } catch (httpError) {
          const httpErr = httpError instanceof Error ? httpError : new Error('Unknown HTTP error');
          logError(httpErr, { 
            method, 
            context, 
            provider: 'HTTP Fallback',
            message: httpErr.message,
            fullError: httpErr
          });
          
          this.telemetry.recordError(httpErr, { 
            method, 
            provider: 'http-fallback',
            context 
          });
          
          throw httpErr;
        }
      }
      
      throw err;
    }
  }

  async list(repositoryId: string, status?: string): Promise<PullRequestListResult> {
    await this.rateLimiter.acquire();
    logRequest('listPullRequests', repositoryId);

    try {
      return await this.tryWithHttpFallback(
        'listPullRequests',
        (provider) => provider.listPullRequests(repositoryId, status),
        repositoryId
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'listPullRequests', repositoryId });
      this.telemetry.recordError(err, { method: 'listPullRequests' });
      throw err;
    }
  }

  async get(repositoryId: string, pullRequestId: number): Promise<PullRequest> {
    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('getPullRequest', `${pullRequestId}`);

    try {
      const result = await this.executeWithResilience(
        () => this.provider.getPullRequest(repositoryId, pullRequestId)
      );

      const duration = Date.now() - startTime;
      logResponse('getPullRequest', `${pullRequestId}`, duration);

      this.telemetry.recordRequest({
        method: 'getPullRequest',
        success: true,
        duration,
        provider: this.getProviderType()
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'getPullRequest', pullRequestId });
      this.telemetry.recordError(err, { method: 'getPullRequest' });
      throw err;
    }
  }

  async create(repositoryId: string, data: CreatePullRequestPayload): Promise<PullRequest> {
    if (!data || !data.sourceRefName || !data.targetRefName || !data.title) {
      throw new Error('Pull Request requires sourceRefName, targetRefName and title');
    }

    await this.rateLimiter.acquire();
    logRequest('createPullRequest', data.title);

    try {
      return await this.tryWithHttpFallback(
        'createPullRequest',
        (provider) => provider.createPullRequest(repositoryId, data),
        data.title
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'createPullRequest', data });
      this.telemetry.recordError(err, { method: 'createPullRequest' });
      throw err;
    }
  }

  async update(repositoryId: string, pullRequestId: number, data: UpdatePullRequestPayload): Promise<PullRequest> {
    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('updatePullRequest', `${pullRequestId}`);

    try {
      const result = await this.executeWithResilience(
        () => this.provider.updatePullRequest(repositoryId, pullRequestId, data)
      );

      const duration = Date.now() - startTime;
      logResponse('updatePullRequest', `${pullRequestId}`, duration);

      this.telemetry.recordRequest({
        method: 'updatePullRequest',
        success: true,
        duration,
        provider: this.getProviderType()
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'updatePullRequest', pullRequestId });
      this.telemetry.recordError(err, { method: 'updatePullRequest' });
      throw err;
    }
  }

  async merge(repositoryId: string, pullRequestId: number, data: MergePullRequestPayload): Promise<PullRequest> {
    await this.rateLimiter.acquire();
    logRequest('mergePullRequest', `${pullRequestId}`);

    try {
      return await this.tryWithHttpFallback(
        'mergePullRequest',
        (provider) => provider.mergePullRequest(repositoryId, pullRequestId, data),
        `${pullRequestId}`
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'mergePullRequest', pullRequestId });
      this.telemetry.recordError(err, { method: 'mergePullRequest' });
      throw err;
    }
  }

  async addComment(repositoryId: string, pullRequestId: number, data: AddCommentPayload): Promise<PullRequestThread> {
    await this.rateLimiter.acquire();
    logRequest('addPullRequestComment', `${pullRequestId}`);

    try {
      return await this.tryWithHttpFallback(
        'addPullRequestComment',
        (provider) => provider.addPullRequestComment(repositoryId, pullRequestId, data),
        `${pullRequestId}`
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'addPullRequestComment', pullRequestId });
      this.telemetry.recordError(err, { method: 'addPullRequestComment' });
      throw err;
    }
  }

  async addReviewer(repositoryId: string, pullRequestId: number, data: AddReviewerPayload): Promise<PullRequest> {
    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('addPullRequestReviewer', `${pullRequestId}`);

    try {
      const result = await this.executeWithResilience(
        () => this.provider.addPullRequestReviewer(repositoryId, pullRequestId, data)
      );

      const duration = Date.now() - startTime;
      logResponse('addPullRequestReviewer', `${pullRequestId}`, duration);

      this.telemetry.recordRequest({
        method: 'addPullRequestReviewer',
        success: true,
        duration,
        provider: this.getProviderType()
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'addPullRequestReviewer', pullRequestId });
      this.telemetry.recordError(err, { method: 'addPullRequestReviewer' });
      throw err;
    }
  }

  async vote(repositoryId: string, pullRequestId: number, reviewerId: string, data: PullRequestVotePayload): Promise<PullRequest> {
    await this.rateLimiter.acquire();
    logRequest('votePullRequest', `${pullRequestId}`);

    try {
      return await this.tryWithHttpFallback(
        'votePullRequest',
        (provider) => provider.votePullRequest(repositoryId, pullRequestId, reviewerId, data),
        `${pullRequestId}`
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'votePullRequest', pullRequestId });
      this.telemetry.recordError(err, { method: 'votePullRequest' });
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

