interface RequestMetadata {
  method: string;
  success: boolean;
  duration: number;
  provider: string;
  fallbackUsed?: boolean;
}

interface TelemetryMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalDuration: number;
  averageDuration: number;
  p95Duration: number;
  p99Duration: number;
  byMethod: Record<string, number>;
  byProvider: Record<string, number>;
  circuitBreakerStateChanges: number;
}

export class TelemetryCollector {
  private requests: RequestMetadata[] = [];
  private circuitBreakerChanges: number = 0;
  private enabled: boolean;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  recordRequest(metadata: RequestMetadata): void {
    if (!this.enabled) return;

    this.requests.push(metadata);

    if (this.requests.length > 1000) {
      this.requests = this.requests.slice(-1000);
    }
  }

  recordError(_error: Error, context?: Record<string, unknown>): void {
    if (!this.enabled) return;

    this.recordRequest({
      method: context?.method as string || 'unknown',
      success: false,
      duration: 0,
      provider: context?.provider as string || 'unknown'
    });
  }

  recordCircuitBreakerChange(): void {
    if (!this.enabled) return;
    this.circuitBreakerChanges++;
  }

  getMetrics(): TelemetryMetrics {
    const durations = this.requests
      .filter(r => r.success)
      .map(r => r.duration)
      .sort((a, b) => a - b);

    const totalRequests = this.requests.length;
    const successfulRequests = this.requests.filter(r => r.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const totalDuration = this.requests.reduce((sum, r) => sum + r.duration, 0);
    const averageDuration = totalRequests > 0 ? totalDuration / totalRequests : 0;

    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);
    const p95Duration = durations[p95Index] || 0;
    const p99Duration = durations[p99Index] || 0;

    const byMethod: Record<string, number> = {};
    const byProvider: Record<string, number> = {};

    for (const request of this.requests) {
      byMethod[request.method] = (byMethod[request.method] || 0) + 1;
      byProvider[request.provider] = (byProvider[request.provider] || 0) + 1;
    }

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      totalDuration,
      averageDuration,
      p95Duration,
      p99Duration,
      byMethod,
      byProvider,
      circuitBreakerStateChanges: this.circuitBreakerChanges
    };
  }

  reset(): void {
    this.requests = [];
    this.circuitBreakerChanges = 0;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

