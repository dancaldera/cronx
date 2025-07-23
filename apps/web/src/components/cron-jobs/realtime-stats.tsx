import { useNextExecutionTimer, type LastResponseData } from '@/hooks/use-cron-realtime';
import { ClockIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface RealtimeStatsProps {
  executionCount: number;
  successCount: number;
  failureCount: number;
  nextExecution: string | null;
  lastExecution: string | null;
  lastResponse?: LastResponseData | null;
  isEnabled: boolean;
}

export function RealtimeStats({
  executionCount,
  successCount,
  failureCount,
  nextExecution,
  lastExecution,
  lastResponse,
  isEnabled
}: RealtimeStatsProps) {
  const timeUntilNext = useNextExecutionTimer(nextExecution);

  const getLastResponseIcon = () => {
    if (!lastResponse) return null;
    
    switch (lastResponse.status) {
      case 'success':
        return <CheckCircleIcon className="h-3 w-3 text-green-500" />;
      case 'failure':
        return <XCircleIcon className="h-3 w-3 text-red-500" />;
      case 'timeout':
        return <ExclamationTriangleIcon className="h-3 w-3 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      {/* Execution Stats */}
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {executionCount} executions
          </div>
          {lastResponse && (
            <div className="flex items-center space-x-1" title={`Last: ${lastResponse.status}`}>
              {getLastResponseIcon()}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {lastResponse.responseStatus || 'N/A'}
              </span>
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            {successCount} ✓
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            {failureCount} ✗
          </span>
        </div>
      </div>

      {/* Next Execution Timer - Only show if job is enabled */}
      {isEnabled && (
        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
          <ClockIcon className="h-3 w-3" />
          <span className="font-mono">
            {timeUntilNext}
          </span>
        </div>
      )}

      {/* Paused State Indicator */}
      {!isEnabled && (
        <div className="flex items-center space-x-1 text-xs text-gray-400 dark:text-gray-500">
          <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500"></div>
          <span className="italic">Paused</span>
        </div>
      )}

      {/* Last execution time */}
      {lastExecution && (
        <div className="text-xs text-gray-400 dark:text-gray-500">
          Last: {new Date(lastExecution).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}