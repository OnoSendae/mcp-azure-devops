import { IProvider, WorkItem, CreateWorkItemPayload, UpdateWorkItemPayload, AddWorkItemRelationPayload, WorkItemType, WorkItemFields } from '../types';
import { RetryPolicy, CircuitBreaker } from '../core/resilience';
import { RateLimiter, ValidationRules } from '../core/rules';
import { logRequest, logResponse, logError } from '../logging/logger';
import { TelemetryCollector } from '../logging/telemetry';

export class WorkItemsAPI {
  private provider: IProvider;
  private retryPolicy: RetryPolicy;
  private circuitBreaker: CircuitBreaker;
  private rateLimiter: RateLimiter;
  private validationRules: ValidationRules;
  private telemetry: TelemetryCollector;

  constructor(
    provider: IProvider,
    retryPolicy: RetryPolicy,
    circuitBreaker: CircuitBreaker,
    rateLimiter: RateLimiter,
    validationRules: ValidationRules,
    telemetry: TelemetryCollector
  ) {
    this.provider = provider;
    this.retryPolicy = retryPolicy;
    this.circuitBreaker = circuitBreaker;
    this.rateLimiter = rateLimiter;
    this.validationRules = validationRules;
    this.telemetry = telemetry;
  }

  async create(type: WorkItemType, fields: Partial<WorkItemFields>): Promise<WorkItem> {
    const payload: CreateWorkItemPayload = { type, fields };
    this.validationRules.validateWorkItemPayload(payload);

    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('createWorkItem', type, { fields: Object.keys(fields) });

    try {
      const result = await this.executeWithResilience(
        () => this.provider.createWorkItem(payload, true)
      );

      const duration = Date.now() - startTime;
      logResponse('createWorkItem', type, duration);

      this.telemetry.recordRequest({
        method: 'createWorkItem',
        success: true,
        duration,
        provider: this.getProviderType()
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'createWorkItem', type });
      this.telemetry.recordError(err, { method: 'createWorkItem' });
      throw err;
    }
  }

  async get(id: number, fields?: string[]): Promise<WorkItem> {
    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('getWorkItem', `${id}`, { fields });

    try {
      const result = await this.executeWithResilience(
        () => this.provider.getWorkItem(id, fields)
      );

      const duration = Date.now() - startTime;
      logResponse('getWorkItem', `${id}`, duration);

      this.telemetry.recordRequest({
        method: 'getWorkItem',
        success: true,
        duration,
        provider: this.getProviderType()
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'getWorkItem', id });
      this.telemetry.recordError(err, { method: 'getWorkItem' });
      throw err;
    }
  }

  async update(id: number, operations: UpdateWorkItemPayload['operations']): Promise<WorkItem> {
    const payload: UpdateWorkItemPayload = { operations };

    if (!operations || operations.length === 0) {
      throw new Error('Update operations are required');
    }

    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('updateWorkItem', `${id}`, { operationsCount: operations.length });

    try {
      const result = await this.executeWithResilience(
        () => this.provider.updateWorkItem(id, payload, true)
      );

      const duration = Date.now() - startTime;
      logResponse('updateWorkItem', `${id}`, duration);

      this.telemetry.recordRequest({
        method: 'updateWorkItem',
        success: true,
        duration,
        provider: this.getProviderType()
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'updateWorkItem', id });
      this.telemetry.recordError(err, { method: 'updateWorkItem' });
      throw err;
    }
  }

  async delete(id: number): Promise<void> {
    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('deleteWorkItem', `${id}`);

    try {
      await this.executeWithResilience(
        () => this.provider.deleteWorkItem(id)
      );

      const duration = Date.now() - startTime;
      logResponse('deleteWorkItem', `${id}`, duration);

      this.telemetry.recordRequest({
        method: 'deleteWorkItem',
        success: true,
        duration,
        provider: this.getProviderType()
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'deleteWorkItem', id });
      this.telemetry.recordError(err, { method: 'deleteWorkItem' });
      throw err;
    }
  }

  async getBatch(ids: number[], fields?: string[]): Promise<WorkItem[]> {
    if (!ids || ids.length === 0) {
      return [];
    }

    const batchSize = 200;
    const batches: number[][] = [];

    for (let i = 0; i < ids.length; i += batchSize) {
      batches.push(ids.slice(i, i + batchSize));
    }

    const results: WorkItem[] = [];

    for (const batch of batches) {
      await this.rateLimiter.acquire();
      const startTime = Date.now();

      logRequest('getWorkItems', 'batch', { count: batch.length });

      try {
        const batchResults = await this.executeWithResilience(
          () => this.provider.getWorkItems(batch, fields)
        );

        const duration = Date.now() - startTime;
        logResponse('getWorkItems', 'batch', duration);

        this.telemetry.recordRequest({
          method: 'getWorkItems',
          success: true,
          duration,
          provider: this.getProviderType()
        });

        results.push(...batchResults);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        logError(err, { method: 'getWorkItems', count: batch.length });
        this.telemetry.recordError(err, { method: 'getWorkItems' });
        throw err;
      }
    }

    return results;
  }

  private async executeWithResilience<T>(fn: () => Promise<T>): Promise<T> {
    return this.circuitBreaker.execute(
      () => this.retryPolicy.execute(fn)
    );
  }

  async addRelation(payload: AddWorkItemRelationPayload): Promise<WorkItem> {
    await this.rateLimiter.acquire();
    const startTime = Date.now();

    logRequest('addWorkItemRelation', `${payload.workItemId}`, {
      targetId: payload.targetWorkItemId,
      relationType: payload.relationType
    });

    try {
      const result = await this.executeWithResilience(
        () => this.provider.addWorkItemRelation(payload)
      );

      const duration = Date.now() - startTime;
      logResponse('addWorkItemRelation', `${payload.workItemId}`, duration);

      this.telemetry.recordRequest({
        method: 'addWorkItemRelation',
        success: true,
        duration,
        provider: this.getProviderType()
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logError(err, { method: 'addWorkItemRelation', workItemId: payload.workItemId });
      this.telemetry.recordError(err, { method: 'addWorkItemRelation' });
      throw err;
    }
  }

  private getProviderType(): string {
    return this.provider.constructor.name.replace('Provider', '').toLowerCase();
  }
}

