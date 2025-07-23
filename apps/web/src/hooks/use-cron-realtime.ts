import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface LastResponseData {
  executionTime: string;
  status: 'success' | 'failure' | 'timeout';
  responseStatus: number | null;
  responseBody: string | null;
  responseHeaders: Record<string, string> | null;
  executionDuration: number;
  errorMessage: string | null;
  retryAttempt: number;
}

export interface CronJobStats {
  id: string;
  executionCount: number;
  successCount: number;
  failureCount: number;
  lastExecution: string | null;
  nextExecution: string | null;
  lastResponse: LastResponseData | null;
}

interface UseCronRealtimeOptions {
  refreshInterval?: number;
  enableRealtimeUpdates?: boolean;
}

export function useCronRealtime(options: UseCronRealtimeOptions = {}) {
  const { refreshInterval = 5000, enableRealtimeUpdates = true } = options;
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [realtimeStats, setRealtimeStats] = useState<Record<string, CronJobStats>>({});

  // Fetch execution stats for all cron jobs
  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['cronStats'],
    queryFn: async () => {
      const response = await apiClient.getCronJobsStats();
      return response.data as CronJobStats[];
    },
    enabled: enableRealtimeUpdates,
    refetchInterval: refreshInterval,
  });

  // Update realtime stats when data changes
  useEffect(() => {
    if (statsData) {
      const statsMap = statsData.reduce((acc, stat) => {
        acc[stat.id] = stat;
        return acc;
      }, {} as Record<string, CronJobStats>);
      setRealtimeStats(statsMap);
    }
  }, [statsData]);

  // Set up real-time updates
  useEffect(() => {
    if (!enableRealtimeUpdates) return;

    const startRealtimeUpdates = () => {
      intervalRef.current = setInterval(() => {
        refetchStats();
        // Also invalidate the main cron jobs query to keep everything in sync
        queryClient.invalidateQueries({ queryKey: ['cronJobs'] });
      }, refreshInterval);
    };

    startRealtimeUpdates();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enableRealtimeUpdates, refreshInterval, refetchStats, queryClient]);

  return {
    realtimeStats,
    refetchStats,
  };
}

// Hook for calculating time until next execution
export function useNextExecutionTimer(nextExecution: string | null) {
  const [timeUntilNext, setTimeUntilNext] = useState<string>('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!nextExecution) {
      setTimeUntilNext('Not scheduled');
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const next = new Date(nextExecution).getTime();
      const diff = next - now;

      if (diff <= 0) {
        setTimeUntilNext('Executing soon...');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeUntilNext(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeUntilNext(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeUntilNext(`${minutes}m ${seconds}s`);
      } else {
        setTimeUntilNext(`${seconds}s`);
      }
    };

    // Update immediately
    updateTimer();

    // Set up interval to update every second
    timerRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [nextExecution]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return timeUntilNext;
}