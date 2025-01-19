class RateLimiter {
  constructor(maxAttempts = 5, timeWindow = 300000) { // 5 minutes default
    this.attempts = new Map();
    this.maxAttempts = maxAttempts;
    this.timeWindow = timeWindow;
  }

  isRateLimited(key) {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];
    
    // Clean up old attempts
    const recentAttempts = userAttempts.filter(
      timestamp => now - timestamp < this.timeWindow
    );
    
    if (recentAttempts.length >= this.maxAttempts) {
      return true;
    }
    
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    return false;
  }

  getRemainingTime(key) {
    const userAttempts = this.attempts.get(key) || [];
    if (userAttempts.length === 0) return 0;
    
    const oldestAttempt = userAttempts[0];
    const remainingTime = this.timeWindow - (Date.now() - oldestAttempt);
    return Math.max(0, remainingTime);
  }

  clearAttempts(key) {
    this.attempts.delete(key);
  }
}

export const authLimiter = new RateLimiter(5, 300000); // 5 attempts per 5 minutes
export const resetLimiter = new RateLimiter(3, 600000); // 3 attempts per 10 minutes
export const rateLimit = new RateLimiter(3, 60000); // 3 requests per minute for AI 