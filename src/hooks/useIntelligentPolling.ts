
import { useState, useEffect, useRef, useCallback } from 'react';

interface PollingConfig {
  initialInterval: number;
  maxInterval: number;
  backoffMultiplier: number;
  maxDuration: number;
  successResetInterval: boolean;
}

interface PollingState {
  isPolling: boolean;
  currentInterval: number;
  attemptCount: number;
  lastSuccessTime: number;
  lastErrorTime: number;
}

export const useIntelligentPolling = (
  pollFunction: () => Promise<any>,
  shouldContinuePolling: (result: any) => boolean,
  config: Partial<PollingConfig> = {}
) => {
  const defaultConfig: PollingConfig = {
    initialInterval: 5000, // 5 seconds
    maxInterval: 60000, // 1 minute
    backoffMultiplier: 1.5,
    maxDuration: 300000, // 5 minutes
    successResetInterval: true
  };

  const finalConfig = { ...defaultConfig, ...config };
  
  const [pollingState, setPollingState] = useState<PollingState>({
    isPolling: false,
    currentInterval: finalConfig.initialInterval,
    attemptCount: 0,
    lastSuccessTime: 0,
    lastErrorTime: 0
  });

  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const calculateNextInterval = useCallback((currentInterval: number, isSuccess: boolean): number => {
    if (isSuccess && finalConfig.successResetInterval) {
      return finalConfig.initialInterval;
    }
    
    if (!isSuccess) {
      return Math.min(currentInterval * finalConfig.backoffMultiplier, finalConfig.maxInterval);
    }
    
    return currentInterval;
  }, [finalConfig]);

  const shouldStopPolling = useCallback((startTime: number): boolean => {
    return Date.now() - startTime > finalConfig.maxDuration;
  }, [finalConfig.maxDuration]);

  const executePoll = useCallback(async (): Promise<void> => {
    try {
      console.log(`[IntelligentPolling] Executing poll attempt ${pollingState.attemptCount + 1}`);
      
      const pollResult = await pollFunction();
      const now = Date.now();
      
      setResult(pollResult);
      setError(null);
      
      const shouldContinue = shouldContinuePolling(pollResult);
      const nextInterval = calculateNextInterval(pollingState.currentInterval, true);
      
      setPollingState(prev => ({
        ...prev,
        currentInterval: nextInterval,
        attemptCount: prev.attemptCount + 1,
        lastSuccessTime: now
      }));

      if (!shouldContinue) {
        console.log('[IntelligentPolling] Polling completed successfully');
        setPollingState(prev => ({ ...prev, isPolling: false }));
        return;
      }

      if (shouldStopPolling(startTimeRef.current)) {
        console.log('[IntelligentPolling] Polling stopped due to max duration');
        setPollingState(prev => ({ ...prev, isPolling: false }));
        setError('Polling timed out after maximum duration');
        return;
      }

      // Schedule next poll
      timeoutRef.current = setTimeout(executePoll, nextInterval);
      
    } catch (err: any) {
      console.error('[IntelligentPolling] Poll failed:', err);
      
      const now = Date.now();
      const nextInterval = calculateNextInterval(pollingState.currentInterval, false);
      
      setError(err.message);
      setPollingState(prev => ({
        ...prev,
        currentInterval: nextInterval,
        attemptCount: prev.attemptCount + 1,
        lastErrorTime: now
      }));

      if (shouldStopPolling(startTimeRef.current)) {
        console.log('[IntelligentPolling] Polling stopped due to max duration after error');
        setPollingState(prev => ({ ...prev, isPolling: false }));
        return;
      }

      // Schedule retry with backoff
      timeoutRef.current = setTimeout(executePoll, nextInterval);
    }
  }, [
    pollFunction,
    shouldContinuePolling,
    pollingState.attemptCount,
    pollingState.currentInterval,
    calculateNextInterval,
    shouldStopPolling
  ]);

  const startPolling = useCallback(() => {
    if (pollingState.isPolling) {
      console.log('[IntelligentPolling] Already polling, ignoring start request');
      return;
    }

    console.log('[IntelligentPolling] Starting intelligent polling');
    startTimeRef.current = Date.now();
    
    setPollingState({
      isPolling: true,
      currentInterval: finalConfig.initialInterval,
      attemptCount: 0,
      lastSuccessTime: 0,
      lastErrorTime: 0
    });
    
    setError(null);
    
    // Start first poll immediately
    executePoll();
  }, [pollingState.isPolling, finalConfig.initialInterval, executePoll]);

  const stopPolling = useCallback(() => {
    console.log('[IntelligentPolling] Stopping polling');
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setPollingState(prev => ({ ...prev, isPolling: false }));
  }, []);

  const resetPolling = useCallback(() => {
    stopPolling();
    setResult(null);
    setError(null);
    setPollingState({
      isPolling: false,
      currentInterval: finalConfig.initialInterval,
      attemptCount: 0,
      lastSuccessTime: 0,
      lastErrorTime: 0
    });
  }, [stopPolling, finalConfig.initialInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    result,
    error,
    pollingState,
    startPolling,
    stopPolling,
    resetPolling,
    isPolling: pollingState.isPolling
  };
};
