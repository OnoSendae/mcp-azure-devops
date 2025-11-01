import { CreateWorkItemPayload, WorkItemFields } from '../types';

export class RateLimiter {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number;
  private lastRefill: number;

  constructor(maxTokens: number = 100, refillRate: number = 10) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.refillRate = refillRate;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    const waitTime = ((1 - this.tokens) / this.refillRate) * 1000;
    await this.sleep(waitTime);
    this.tokens = 0;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.refillRate;
    
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getAvailableTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
  }
}

export class ValidationRules {
  validateWorkItemPayload(payload: CreateWorkItemPayload): void {
    if (!payload.type) {
      throw new Error('Work item type is required');
    }

    if (!payload.fields || Object.keys(payload.fields).length === 0) {
      throw new Error('Work item fields are required');
    }

    const title = payload.fields['System.Title'];
    if (!title || typeof title !== 'string') {
      throw new Error('System.Title is required and must be a string');
    }

    if (title.length === 0) {
      throw new Error('System.Title cannot be empty');
    }

    if (title.length > 255) {
      throw new Error('System.Title cannot exceed 255 characters');
    }

    this.validateFieldTypes(payload.fields);
  }

  private validateFieldTypes(fields: Partial<WorkItemFields>): void {
    const numberFields = [
      'Microsoft.VSTS.Scheduling.StoryPoints',
      'Microsoft.VSTS.Scheduling.Effort',
      'Microsoft.VSTS.Scheduling.RemainingWork',
      'Microsoft.VSTS.Common.Priority'
    ];

    for (const field of numberFields) {
      const value = fields[field as keyof WorkItemFields];
      if (value !== undefined && typeof value !== 'number') {
        throw new Error(`${field} must be a number`);
      }
    }

    if (fields['Microsoft.VSTS.Common.Priority'] !== undefined) {
      const priority = fields['Microsoft.VSTS.Common.Priority'] as number;
      if (priority < 1 || priority > 4) {
        throw new Error('Priority must be between 1 and 4');
      }
    }
  }
}

