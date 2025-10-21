export interface RateLimitConfig {
    maxAttempts: number;
    windowDuration: number;
    alertThreshold: number;
}
export declare abstract class RateLimitMonitor {
    static trackRequest(identifier: string, endpoint: string): Promise<void>;
    static checkExcessiveAttempts(identifier: string, endpoint: string): Promise<boolean>;
    static generateAlert(identifier: string, endpoint: string, attempts: number): Promise<void>;
    static getAttemptCount(identifier: string, endpoint: string): Promise<number>;
    static resetLimit(identifier: string, endpoint: string): Promise<void>;
}
