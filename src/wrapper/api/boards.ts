import { IProvider, Board, BoardsListResult, BoardSettings } from '../types';
import { RetryPolicy, CircuitBreaker } from '../core/resilience';
import { RateLimiter } from '../core/rules';
import { logRequest, logResponse, logError } from '../logging/logger';
import { TelemetryCollector } from '../logging/telemetry';

export class BoardsAPI {
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

  async list(): Promise<BoardsListResult> {
    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('listBoards', 'all');

    try {
      const result = await this.executeWithResilience(
        () => this.provider.listBoards()
      );

      const duration = Date.now() - startTime;
      logResponse('listBoards', 'all', duration);
      
      this.telemetry.recordRequest({
        method: 'listBoards',
        success: true,
        duration,
        provider: this.getProviderType()
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'listBoards' });
      this.telemetry.recordError(err, { method: 'listBoards' });
      throw err;
    }
  }

  async get(boardId: string): Promise<Board> {
    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('getBoard', boardId);

    try {
      const result = await this.executeWithResilience(
        () => this.provider.getBoard(boardId)
      );

      const duration = Date.now() - startTime;
      logResponse('getBoard', boardId, duration);
      
      this.telemetry.recordRequest({
        method: 'getBoard',
        success: true,
        duration,
        provider: this.getProviderType()
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'getBoard', boardId });
      this.telemetry.recordError(err, { method: 'getBoard' });
      throw err;
    }
  }

  async updateSettings(boardId: string, settings: Partial<BoardSettings>): Promise<Board> {
    if (!settings || Object.keys(settings).length === 0) {
      throw new Error('Board settings are required for update');
    }

    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('updateBoardSettings', boardId, { settings });

    try {
      const result = await this.executeWithResilience(
        () => this.provider.updateBoardSettings(boardId, settings)
      );

      const duration = Date.now() - startTime;
      logResponse('updateBoardSettings', boardId, duration);
      
      this.telemetry.recordRequest({
        method: 'updateBoardSettings',
        success: true,
        duration,
        provider: this.getProviderType()
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'updateBoardSettings', boardId });
      this.telemetry.recordError(err, { method: 'updateBoardSettings' });
      throw err;
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

