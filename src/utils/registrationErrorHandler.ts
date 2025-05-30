
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

export class RegistrationErrorHandler {
  private static instance: RegistrationErrorHandler;
  private circuitBreakerState: Map<string, {
    failures: number;
    lastFailureTime: number;
    state: 'closed' | 'open' | 'half-open';
  }> = new Map();

  private defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2
  };

  private defaultCircuitConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    resetTimeout: 60000, // 1 minute
    monitoringPeriod: 300000 // 5 minutes
  };

  static getInstance(): RegistrationErrorHandler {
    if (!this.instance) {
      this.instance = new RegistrationErrorHandler();
    }
    return this.instance;
  }

  // Exponential backoff retry with jitter
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const finalConfig = { ...this.defaultRetryConfig, ...config };
    let lastError: Error;

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        // Check circuit breaker
        if (!this.isCircuitClosed(operationName)) {
          throw new Error(`Circuit breaker open for operation: ${operationName}`);
        }

        const result = await operation();
        
        // Success - reset circuit breaker
        this.recordSuccess(operationName);
        return result;
        
      } catch (error: any) {
        lastError = error;
        this.recordFailure(operationName);

        console.error(`Attempt ${attempt + 1}/${finalConfig.maxRetries + 1} failed for ${operationName}:`, error);

        // Don't wait after the last attempt
        if (attempt < finalConfig.maxRetries) {
          const delay = this.calculateDelay(attempt, finalConfig);
          console.log(`Retrying ${operationName} in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    throw new Error(`Operation ${operationName} failed after ${finalConfig.maxRetries + 1} attempts. Last error: ${lastError.message}`);
  }

  // Circuit breaker implementation
  private isCircuitClosed(operationName: string): boolean {
    const circuit = this.circuitBreakerState.get(operationName);
    
    if (!circuit) {
      this.circuitBreakerState.set(operationName, {
        failures: 0,
        lastFailureTime: 0,
        state: 'closed'
      });
      return true;
    }

    const now = Date.now();

    switch (circuit.state) {
      case 'closed':
        return true;
        
      case 'open':
        if (now - circuit.lastFailureTime > this.defaultCircuitConfig.resetTimeout) {
          circuit.state = 'half-open';
          console.log(`Circuit breaker for ${operationName} moving to half-open state`);
        }
        return circuit.state !== 'open';
        
      case 'half-open':
        return true;
        
      default:
        return true;
    }
  }

  private recordSuccess(operationName: string): void {
    const circuit = this.circuitBreakerState.get(operationName);
    if (circuit) {
      circuit.failures = 0;
      circuit.state = 'closed';
      console.log(`Circuit breaker for ${operationName} reset to closed state`);
    }
  }

  private recordFailure(operationName: string): void {
    let circuit = this.circuitBreakerState.get(operationName);
    
    if (!circuit) {
      circuit = {
        failures: 0,
        lastFailureTime: 0,
        state: 'closed'
      };
      this.circuitBreakerState.set(operationName, circuit);
    }

    circuit.failures += 1;
    circuit.lastFailureTime = Date.now();

    if (circuit.failures >= this.defaultCircuitConfig.failureThreshold) {
      circuit.state = 'open';
      console.warn(`Circuit breaker for ${operationName} opened after ${circuit.failures} failures`);
    }
  }

  private calculateDelay(attempt: number, config: RetryConfig): number {
    const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
    const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
    return Math.min(exponentialDelay + jitter, config.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Error categorization for better handling
  categorizeError(error: any): 'network' | 'authentication' | 'validation' | 'server' | 'unknown' {
    const message = error?.message?.toLowerCase() || '';
    
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'network';
    }
    
    if (message.includes('auth') || message.includes('unauthorized') || message.includes('token')) {
      return 'authentication';
    }
    
    if (message.includes('validation') || message.includes('invalid') || error?.status === 400) {
      return 'validation';
    }
    
    if (error?.status >= 500) {
      return 'server';
    }
    
    return 'unknown';
  }

  // Get user-friendly error messages
  getUserFriendlyMessage(error: any): string {
    const category = this.categorizeError(error);
    
    switch (category) {
      case 'network':
        return 'Network connection issue. Please check your internet connection and try again.';
      case 'authentication':
        return 'Authentication error. Please sign in again.';
      case 'validation':
        return 'Invalid data provided. Please check your information and try again.';
      case 'server':
        return 'Server error. Our team has been notified. Please try again in a few minutes.';
      default:
        return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
    }
  }

  // Reset all circuit breakers (for debugging/admin)
  resetAllCircuitBreakers(): void {
    this.circuitBreakerState.clear();
    console.log('All circuit breakers have been reset');
  }

  // Get circuit breaker status (for monitoring)
  getCircuitBreakerStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    
    this.circuitBreakerState.forEach((circuit, operationName) => {
      status[operationName] = {
        state: circuit.state,
        failures: circuit.failures,
        lastFailureTime: circuit.lastFailureTime
      };
    });
    
    return status;
  }
}

export const registrationErrorHandler = RegistrationErrorHandler.getInstance();
