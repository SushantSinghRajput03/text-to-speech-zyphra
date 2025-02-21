interface ApiKeyStatus {
  key: string;
  isAvailable: boolean;
  lastUsed: Date;
  errorCount: number;
  dailyUsage: number;
  monthlyUsage: number;
  lastDailyReset: Date;
  lastMonthlyReset: Date;
}

export class ApiKeyManager {
  private apiKeys: ApiKeyStatus[] = [];
  private currentKeyIndex: number = 0;
  private readonly maxErrorCount: number = 3;
  private readonly errorResetIntervalMs: number = 1000 * 60 * 5; // 5 minutes
  private readonly dailyLimit: number = 1000;
  private readonly monthlyLimit: number = 25000;

  constructor(keys: string[]) {
    if (!keys.length) {
      throw new Error('At least one API key is required');
    }

    const now = new Date();
    this.apiKeys = keys.map(key => ({
      key,
      isAvailable: true,
      lastUsed: now,
      errorCount: 0,
      dailyUsage: 0,
      monthlyUsage: 0,
      lastDailyReset: now,
      lastMonthlyReset: now
    }));
  }

  public getCurrentKey(): string {
    this.resetUsageCountsIfNeeded();
    
    const startingIndex = this.currentKeyIndex;
    let attempts = 0;

    while (attempts < this.apiKeys.length) {
      const currentKey = this.apiKeys[this.currentKeyIndex];

      if (this.isKeyUsable(currentKey)) {
        return currentKey.key;
      }

      this.rotateToNextKey();
      attempts++;
    }

    throw new Error('No available API keys');
  }

  public incrementUsage(key: string): void {
    const keyStatus = this.findKeyStatus(key);
    if (keyStatus) {
      keyStatus.lastUsed = new Date();
      keyStatus.dailyUsage++;
      keyStatus.monthlyUsage++;
      console.log(`Usage incremented for key ending in ...${key.slice(-4)}: Daily=${keyStatus.dailyUsage}, Monthly=${keyStatus.monthlyUsage}`);
    }
  }

  private isKeyUsable(keyStatus: ApiKeyStatus): boolean {
    return keyStatus.isAvailable &&
           keyStatus.errorCount < this.maxErrorCount &&
           keyStatus.dailyUsage < this.dailyLimit &&
           keyStatus.monthlyUsage < this.monthlyLimit;
  }

  private rotateToNextKey(): void {
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
  }

  public markKeyError(key: string): void {
    const keyStatus = this.findKeyStatus(key);
    if (keyStatus) {
      keyStatus.errorCount++;
      console.log(`Error count increased for key ending in ...${key.slice(-4)}: ${keyStatus.errorCount}`);
      
      if (keyStatus.errorCount >= this.maxErrorCount) {
        keyStatus.isAvailable = false;
        console.log(`Key ending in ...${key.slice(-4)} marked as unavailable due to errors`);
        
        // Schedule key recovery
        setTimeout(() => {
          if (keyStatus.errorCount >= this.maxErrorCount) {
            keyStatus.errorCount = 0;
            keyStatus.isAvailable = true;
            console.log(`Key ending in ...${key.slice(-4)} recovered and marked as available`);
          }
        }, this.errorResetIntervalMs);
      }
    }
  }

  private resetUsageCountsIfNeeded(): void {
    const now = new Date();
    this.apiKeys.forEach(keyStatus => {
      // Reset daily usage if it's a new day
      if (this.isDifferentDay(keyStatus.lastDailyReset, now)) {
        const oldUsage = keyStatus.dailyUsage;
        keyStatus.dailyUsage = 0;
        keyStatus.lastDailyReset = now;
        console.log(`Daily usage reset for key ending in ...${keyStatus.key.slice(-4)}: ${oldUsage} -> 0`);
      }

      // Reset monthly usage if it's a new month
      if (this.isDifferentMonth(keyStatus.lastMonthlyReset, now)) {
        const oldUsage = keyStatus.monthlyUsage;
        keyStatus.monthlyUsage = 0;
        keyStatus.lastMonthlyReset = now;
        console.log(`Monthly usage reset for key ending in ...${keyStatus.key.slice(-4)}: ${oldUsage} -> 0`);
      }
    });
  }

  private isDifferentDay(date1: Date, date2: Date): boolean {
    return date1.getUTCDate() !== date2.getUTCDate() ||
           date1.getUTCMonth() !== date2.getUTCMonth() ||
           date1.getUTCFullYear() !== date2.getUTCFullYear();
  }

  private isDifferentMonth(date1: Date, date2: Date): boolean {
    return date1.getUTCMonth() !== date2.getUTCMonth() ||
           date1.getUTCFullYear() !== date2.getUTCFullYear();
  }

  private findKeyStatus(key: string): ApiKeyStatus | undefined {
    return this.apiKeys.find(k => k.key === key);
  }

  public getKeysStatus(): Array<Omit<ApiKeyStatus, 'key'>> {
    return this.apiKeys.map(({ key, ...status }) => ({
      ...status,
      keyPreview: `...${key.slice(-4)}`
    }));
  }

  // New method to get detailed usage statistics
  public getUsageStats() {
    return this.apiKeys.map(key => ({
      keyPreview: `...${key.key.slice(-4)}`,
      dailyUsage: key.dailyUsage,
      monthlyUsage: key.monthlyUsage,
      dailyLimit: this.dailyLimit,
      monthlyLimit: this.monthlyLimit,
      isAvailable: key.isAvailable,
      errorCount: key.errorCount,
      lastUsed: key.lastUsed,
      lastDailyReset: key.lastDailyReset,
      lastMonthlyReset: key.lastMonthlyReset
    }));
  }
} 