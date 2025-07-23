import { useEffect } from 'react';
import { XMarkIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface LastResponseData {
  executionTime: string;
  status: 'success' | 'failure' | 'timeout';
  responseStatus: number | null;
  responseBody: string | null;
  responseHeaders: Record<string, string> | null;
  executionDuration: number;
  errorMessage: string | null;
  retryAttempt: number;
}

interface LastResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  cronJobName: string;
  responseData: LastResponseData | null;
}

export function LastResponseModal({
  isOpen,
  onClose,
  cronJobName,
  responseData
}: LastResponseModalProps) {
  // Handle escape key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !responseData) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failure':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'timeout':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
      case 'failure':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
      case 'timeout':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  };

  const formatJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
          <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
            <button
              type="button"
              className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="w-full">
              <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white mb-4">
                Last Response - {cronJobName}
              </h3>

                    <div className="space-y-6">
                      {/* Execution Overview */}
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Status</div>
                            <div className="flex items-center space-x-2 mt-1">
                              {getStatusIcon(responseData.status)}
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(responseData.status)}`}>
                                {responseData.status.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Duration</div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                              {formatDuration(responseData.executionDuration)}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">HTTP Status</div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                              {responseData.responseStatus || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Executed At</div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                              {new Date(responseData.executionTime).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        
                        {responseData.retryAttempt > 0 && (
                          <div className="mt-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border-l-4 border-yellow-400">
                            <div className="text-sm text-yellow-700 dark:text-yellow-400">
                              Retry attempt #{responseData.retryAttempt}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Error Message */}
                      {responseData.errorMessage && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Error Message
                          </h4>
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                            <pre className="text-sm text-red-700 dark:text-red-400 whitespace-pre-wrap">
                              {responseData.errorMessage}
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* Response Headers */}
                      {responseData.responseHeaders && Object.keys(responseData.responseHeaders).length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Response Headers
                          </h4>
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3 max-h-48 overflow-auto">
                            <pre className="text-xs text-gray-700 dark:text-gray-300">
                              {formatJson(responseData.responseHeaders)}
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* Response Body */}
                      {responseData.responseBody && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Response Body
                          </h4>
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3 max-h-64 overflow-auto">
                            <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {responseData.responseBody}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}