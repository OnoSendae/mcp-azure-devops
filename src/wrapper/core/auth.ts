export class AuthManager {
  private pat: string;
  private cachedHeaders?: Record<string, string>;
  private lastValidation: Date;
  private validationInterval: number = 5 * 60 * 1000;

  constructor(pat: string) {
    this.pat = pat;
    this.lastValidation = new Date(0);
  }

  getAuthHeaders(): Record<string, string> {
    if (this.cachedHeaders && this.isValidationFresh()) {
      return this.cachedHeaders;
    }

    const encoded = this.encodeBasicAuth(this.pat);
    this.cachedHeaders = {
      'Authorization': `Basic ${encoded}`
    };
    this.lastValidation = new Date();

    return this.cachedHeaders;
  }

  validatePAT(): boolean {
    if (!this.pat || this.pat.length < 20) {
      return false;
    }
    return true;
  }

  encodeBasicAuth(pat: string): string {
    return Buffer.from(`:${pat}`).toString('base64');
  }

  private isValidationFresh(): boolean {
    const now = Date.now();
    const lastCheck = this.lastValidation.getTime();
    return (now - lastCheck) < this.validationInterval;
  }

  refreshValidation(): void {
    this.cachedHeaders = undefined;
    this.lastValidation = new Date(0);
  }
}

