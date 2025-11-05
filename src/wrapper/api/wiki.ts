import { IProvider } from '../types/providers';
import { Wiki, WikisListResult, WikiPage, WikiPagesListResult, CreateWikiPayload, CreateWikiPagePayload, UpdateWikiPagePayload } from '../types/wiki';
import { RetryPolicy, CircuitBreaker } from '../core/resilience';
import { RateLimiter } from '../core/rules';
import { logRequest, logResponse, logError } from '../logging/logger';
import { TelemetryCollector } from '../logging/telemetry';

export class WikiAPI {
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

  async listWikis(): Promise<WikisListResult> {
    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('listWikis', 'all');

    try {
      const result = await this.tryWithHttpFallback(
        () => this.provider.listWikis(),
        (httpProvider) => httpProvider.listWikis(),
        'listWikis'
      );

      const duration = Date.now() - startTime;
      logResponse('listWikis', 'all', duration);
      
      this.telemetry.recordRequest({
        method: 'listWikis',
        success: true,
        duration,
        provider: this.getProviderType()
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'listWikis' });
      this.telemetry.recordError(err, { method: 'listWikis' });
      throw err;
    }
  }

  async getWiki(wikiIdentifier: string): Promise<Wiki> {
    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('getWiki', wikiIdentifier);

    try {
      const result = await this.tryWithHttpFallback(
        () => this.provider.getWiki(wikiIdentifier),
        (httpProvider) => httpProvider.getWiki(wikiIdentifier),
        'getWiki'
      );

      const duration = Date.now() - startTime;
      logResponse('getWiki', wikiIdentifier, duration);
      
      this.telemetry.recordRequest({
        method: 'getWiki',
        success: true,
        duration,
        provider: this.getProviderType()
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'getWiki', wikiIdentifier });
      this.telemetry.recordError(err, { method: 'getWiki' });
      throw err;
    }
  }

  async createWiki(data: CreateWikiPayload): Promise<Wiki> {
    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('createWiki', data.name);

    try {
      const result = await this.tryWithHttpFallback(
        () => this.provider.createWiki(data),
        (httpProvider) => httpProvider.createWiki(data),
        'createWiki'
      );

      const duration = Date.now() - startTime;
      logResponse('createWiki', data.name, duration);
      
      this.telemetry.recordRequest({
        method: 'createWiki',
        success: true,
        duration,
        provider: this.getProviderType()
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'createWiki', data });
      this.telemetry.recordError(err, { method: 'createWiki' });
      throw err;
    }
  }

  async deleteWiki(wikiIdentifier: string): Promise<void> {
    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('deleteWiki', wikiIdentifier);

    try {
      await this.executeWithResilience(
        () => this.provider.deleteWiki(wikiIdentifier)
      );

      const duration = Date.now() - startTime;
      logResponse('deleteWiki', wikiIdentifier, duration);
      
      this.telemetry.recordRequest({
        method: 'deleteWiki',
        success: true,
        duration,
        provider: this.getProviderType()
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'deleteWiki', wikiIdentifier });
      this.telemetry.recordError(err, { method: 'deleteWiki' });
      throw err;
    }
  }

  async listPages(wikiIdentifier: string, path?: string): Promise<WikiPagesListResult> {
    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('listWikiPages', `${wikiIdentifier}${path ? `/${path}` : ''}`);

    try {
      const result = await this.tryWithHttpFallback(
        () => this.provider.listWikiPages(wikiIdentifier, path),
        (httpProvider) => httpProvider.listWikiPages(wikiIdentifier, path),
        'listWikiPages'
      );

      const duration = Date.now() - startTime;
      logResponse('listWikiPages', wikiIdentifier, duration);
      
      this.telemetry.recordRequest({
        method: 'listWikiPages',
        success: true,
        duration,
        provider: this.getProviderType()
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'listWikiPages', wikiIdentifier, path });
      this.telemetry.recordError(err, { method: 'listWikiPages' });
      throw err;
    }
  }

  async getPage(wikiIdentifier: string, path: string, includeContent?: boolean): Promise<WikiPage> {
    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('getWikiPage', `${wikiIdentifier}/${path}`);

    try {
      const result = await this.tryWithHttpFallback(
        () => this.provider.getWikiPage(wikiIdentifier, path, includeContent),
        (httpProvider) => httpProvider.getWikiPage(wikiIdentifier, path, includeContent),
        'getWikiPage'
      );

      const duration = Date.now() - startTime;
      logResponse('getWikiPage', `${wikiIdentifier}/${path}`, duration);
      
      this.telemetry.recordRequest({
        method: 'getWikiPage',
        success: true,
        duration,
        provider: this.getProviderType()
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'getWikiPage', wikiIdentifier, path });
      this.telemetry.recordError(err, { method: 'getWikiPage' });
      throw err;
    }
  }

  async createPage(wikiIdentifier: string, path: string, data: CreateWikiPagePayload): Promise<WikiPage> {
    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('createWikiPage', `${wikiIdentifier}/${path}`);

    try {
      const result = await this.tryWithHttpFallback(
        () => this.provider.createWikiPage(wikiIdentifier, path, data),
        (httpProvider) => httpProvider.createWikiPage(wikiIdentifier, path, data),
        'createWikiPage'
      );

      const duration = Date.now() - startTime;
      logResponse('createWikiPage', `${wikiIdentifier}/${path}`, duration);
      
      this.telemetry.recordRequest({
        method: 'createWikiPage',
        success: true,
        duration,
        provider: this.getProviderType()
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'createWikiPage', wikiIdentifier, path });
      this.telemetry.recordError(err, { method: 'createWikiPage' });
      throw err;
    }
  }

  async updatePage(wikiIdentifier: string, path: string, data: UpdateWikiPagePayload): Promise<WikiPage> {
    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('updateWikiPage', `${wikiIdentifier}/${path}`);

    try {
      const result = await this.tryWithHttpFallback(
        () => this.provider.updateWikiPage(wikiIdentifier, path, data),
        (httpProvider) => httpProvider.updateWikiPage(wikiIdentifier, path, data),
        'updateWikiPage'
      );

      const duration = Date.now() - startTime;
      logResponse('updateWikiPage', `${wikiIdentifier}/${path}`, duration);
      
      this.telemetry.recordRequest({
        method: 'updateWikiPage',
        success: true,
        duration,
        provider: this.getProviderType()
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'updateWikiPage', wikiIdentifier, path });
      this.telemetry.recordError(err, { method: 'updateWikiPage' });
      throw err;
    }
  }

  async deletePage(wikiIdentifier: string, path: string): Promise<void> {
    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('deleteWikiPage', `${wikiIdentifier}/${path}`);

    try {
      await this.executeWithResilience(
        () => this.provider.deleteWikiPage(wikiIdentifier, path)
      );

      const duration = Date.now() - startTime;
      logResponse('deleteWikiPage', `${wikiIdentifier}/${path}`, duration);
      
      this.telemetry.recordRequest({
        method: 'deleteWikiPage',
        success: true,
        duration,
        provider: this.getProviderType()
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'deleteWikiPage', wikiIdentifier, path });
      this.telemetry.recordError(err, { method: 'deleteWikiPage' });
      throw err;
    }
  }

  private async executeWithResilience<T>(fn: () => Promise<T>): Promise<T> {
    return this.circuitBreaker.execute(
      () => this.retryPolicy.execute(fn)
    );
  }

  private async tryWithHttpFallback<T>(
    sdkFn: () => Promise<T>,
    httpFn: (httpProvider: IProvider) => Promise<T>,
    operation: string
  ): Promise<T> {
    try {
      return await this.executeWithResilience(sdkFn);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      
      if (errMsg.includes('not implemented') && this.getHttpFallback) {
        logRequest(`${operation} (HTTP fallback)`, '');
        
        const httpProvider = await this.getHttpFallback();
        const result = await httpFn(httpProvider);
        
        this.telemetry.recordRequest({
          method: operation,
          success: true,
          duration: 0,
          provider: 'HttpProvider',
          fallbackUsed: true
        });
        
        return result;
      }
      
      throw error;
    }
  }

  private getProviderType(): string {
    return this.provider.constructor.name;
  }
}

