import { config as defaultConfig, AzureDevOpsConfig } from './config';
import { ProviderType } from './types';
import { createProvider } from './providers';
import { RetryPolicy, CircuitBreaker } from './core/resilience';
import { RateLimiter, ValidationRules } from './core/rules';
import { logger } from './logging/logger';
import { TelemetryCollector } from './logging/telemetry';
import { WorkItemsAPI } from './api/work-items';
import { WiqlAPI } from './api/wiql';
import { BoardsAPI } from './api/boards';

export interface AzureDevOpsClientOptions {
  config?: Partial<AzureDevOpsConfig>;
  providerType?: ProviderType;
  enableTelemetry?: boolean;
  maxRetries?: number;
  maxRateLimit?: number;
}

export class AzureDevOpsClient {
  public workItems: WorkItemsAPI;
  public wiql: WiqlAPI;
  public boards: BoardsAPI;
  public telemetry: TelemetryCollector;
  
  private provider?: ReturnType<typeof createProvider> extends Promise<infer T> ? T : never;
  private retryPolicy: RetryPolicy;
  private circuitBreaker: CircuitBreaker;
  private rateLimiter: RateLimiter;

  constructor(options: AzureDevOpsClientOptions = {}) {
    this.retryPolicy = new RetryPolicy(options.maxRetries || 3);
    this.circuitBreaker = new CircuitBreaker();
    this.rateLimiter = new RateLimiter(options.maxRateLimit || 100);
    this.telemetry = new TelemetryCollector(options.enableTelemetry !== false);

    this.workItems = {} as WorkItemsAPI;
    this.wiql = {} as WiqlAPI;
    this.boards = {} as BoardsAPI;
  }

  async initialize(options: AzureDevOpsClientOptions = {}): Promise<void> {
    logger.info('Initializing Azure DevOps Client');

    const finalConfig = {
      ...defaultConfig,
      ...options.config
    };

    try {
      this.provider = await createProvider(
        finalConfig,
        options.providerType || 'sdk'
      );

      const validationRules = new ValidationRules();

      this.workItems = new WorkItemsAPI(
        this.provider,
        this.retryPolicy,
        this.circuitBreaker,
        this.rateLimiter,
        validationRules,
        this.telemetry
      );

      this.wiql = new WiqlAPI(
        this.provider,
        this.retryPolicy,
        this.circuitBreaker,
        this.rateLimiter,
        this.telemetry
      );

      this.boards = new BoardsAPI(
        this.provider,
        this.retryPolicy,
        this.circuitBreaker,
        this.rateLimiter,
        this.telemetry
      );

      this.wiql.setWorkItemsAPI(this.workItems);

      logger.info('Azure DevOps Client initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Azure DevOps Client', error);
      throw error;
    }
  }

  get health() {
    if (!this.provider) {
      return {
        initialized: false,
        provider: null,
        circuitBreaker: 'UNKNOWN' as const,
        rateLimit: 0
      };
    }

    return {
      initialized: true,
      provider: this.provider.getHealth(),
      circuitBreaker: this.circuitBreaker.getState(),
      rateLimit: this.rateLimiter.getAvailableTokens()
    };
  }

  resetTelemetry(): void {
    this.telemetry.reset();
  }

  resetRateLimit(): void {
    this.rateLimiter.reset();
  }

  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
  }
}

export const createClient = async (options: AzureDevOpsClientOptions = {}): Promise<AzureDevOpsClient> => {
  const client = new AzureDevOpsClient(options);
  await client.initialize(options);
  return client;
};

export * from './types';
export * from './config';
export { RetryPolicy, CircuitBreaker } from './core/resilience';
export { RateLimiter, ValidationRules } from './core/rules';
export { TelemetryCollector } from './logging/telemetry';
export { logger } from './logging/logger';

