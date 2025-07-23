"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  ArrowLeftIcon,
  PlayIcon,
  PauseIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  GlobeAltIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

interface CronJobDetailPageProps {
  params: { id: string };
}

export default function CronJobDetailPage({ params }: CronJobDetailPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    data: cronJobResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["cronJob", params.id],
    queryFn: () => apiClient.getCronJob(params.id),
    enabled: !!params.id,
  });

  const {
    data: httpTemplateResponse,
    isLoading: templateLoading,
  } = useQuery({
    queryKey: ["httpTemplate", cronJobResponse?.data?.httpTemplateId],
    queryFn: () => apiClient.getHttpTemplate(cronJobResponse.data.httpTemplateId),
    enabled: !!cronJobResponse?.data?.httpTemplateId,
  });

  const {
    data: executionLogsResponse,
    isLoading: logsLoading,
  } = useQuery({
    queryKey: ["cronJobExecutionLogs", params.id],
    queryFn: () => apiClient.getCronJobExecutionLogs(params.id, { limit: 10 }),
    enabled: !!params.id,
  });

  const toggleJobMutation = useMutation({
    mutationFn: ({ isEnabled }: { isEnabled: boolean }) =>
      apiClient.toggleCronJob(params.id, isEnabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cronJob", params.id] });
      queryClient.invalidateQueries({ queryKey: ["cronJobs"] });
    },
  });

  const executeJobMutation = useMutation({
    mutationFn: () => apiClient.executeCronJob(params.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cronJob", params.id] });
      queryClient.invalidateQueries({ queryKey: ["cronJobExecutionLogs", params.id] });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: () => apiClient.deleteCronJob(params.id),
    onSuccess: () => {
      router.push("/dashboard/cron-jobs");
    },
  });

  const handleToggleJob = async () => {
    if (!cronJobResponse?.data) return;
    try {
      await toggleJobMutation.mutateAsync({
        isEnabled: !cronJobResponse.data.isEnabled,
      });
    } catch (error) {
      console.error("Failed to toggle job:", error);
    }
  };

  const handleExecuteJob = async () => {
    try {
      await executeJobMutation.mutateAsync();
    } catch (error) {
      console.error("Failed to execute job:", error);
    }
  };

  const handleDeleteJob = async () => {
    try {
      await deleteJobMutation.mutateAsync();
    } catch (error) {
      console.error("Failed to delete job:", error);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleString();
  };

  const getStatusColor = (isEnabled: boolean) => {
    return isEnabled
      ? "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900"
      : "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700";
  };

  const getExecutionStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900";
      case "failure":
        return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900";
      case "running":
        return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  if (error || !cronJobResponse?.data) {
    return (
      <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
        <div className="text-sm text-red-700 dark:text-red-400">
          Error loading CRON job details. Please try again.
        </div>
      </div>
    );
  }

  const cronJob = cronJobResponse.data;
  const httpTemplate = httpTemplateResponse?.data;
  const executionLogs = executionLogsResponse?.data || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/cron-jobs"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to CRON Jobs
          </Link>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExecuteJob}
            disabled={executeJobMutation.isPending}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <PlayIcon className="h-4 w-4 mr-1" />
            Execute Now
          </button>
          <button
            onClick={handleToggleJob}
            disabled={toggleJobMutation.isPending}
            className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
              cronJob.isEnabled
                ? "text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:ring-yellow-500"
                : "text-green-700 bg-green-100 hover:bg-green-200 focus:ring-green-500"
            }`}
          >
            {cronJob.isEnabled ? (
              <>
                <PauseIcon className="h-4 w-4 mr-1" />
                Pause
              </>
            ) : (
              <>
                <PlayIcon className="h-4 w-4 mr-1" />
                Resume
              </>
            )}
          </button>
          <Link
            href={`/dashboard/cron-jobs/${params.id}/edit`}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PencilIcon className="h-4 w-4 mr-1" />
            Edit
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            Delete
          </button>
        </div>
      </div>

      {/* Job Overview */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {cronJob.name}
            </h1>
            {cronJob.description && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {cronJob.description}
              </p>
            )}
          </div>
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(cronJob.isEnabled)}`}
          >
            {cronJob.isEnabled ? "Active" : "Paused"}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center">
              <ClockIcon className="h-5 w-5 text-gray-400" />
              <h3 className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                Schedule
              </h3>
            </div>
            <p className="mt-2 text-sm font-mono text-gray-600 dark:text-gray-300">
              {cronJob.cronExpression}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <GlobeAltIcon className="h-3 w-3 inline mr-1" />
              {cronJob.timezone}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Executions
            </h3>
            <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
              {cronJob.executionCount}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total runs</p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Success Rate
            </h3>
            <p className="mt-2 text-2xl font-semibold text-green-600 dark:text-green-400">
              {cronJob.executionCount > 0
                ? Math.round((cronJob.successCount / cronJob.executionCount) * 100)
                : 0}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {cronJob.successCount} success, {cronJob.failureCount} failed
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Next Execution
            </h3>
            <p className="mt-2 text-sm text-gray-900 dark:text-white">
              {cronJob.nextExecution
                ? new Date(cronJob.nextExecution).toLocaleString()
                : "Not scheduled"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Last: {formatDate(cronJob.lastExecution)}
            </p>
          </div>
        </div>
      </div>

      {/* HTTP Template Details */}
      {templateLoading ? (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      ) : (
        httpTemplate && (
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              HTTP Template: {httpTemplate.name}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Method & URL
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mr-2">
                    {httpTemplate.method}
                  </span>
                  <span className="font-mono">{httpTemplate.url}</span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Authentication
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {httpTemplate.authType === "none" ? "None" : httpTemplate.authType.toUpperCase()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Timeout
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {cronJob.timeoutSeconds}s
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Retry Attempts
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {cronJob.retryAttempts}
                </dd>
              </div>
            </div>
          </div>
        )
      )}

      {/* Recent Execution Logs */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Recent Executions
          </h3>
          <Link
            href={`/dashboard/logs?cronJobId=${params.id}`}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
          >
            View all logs →
          </Link>
        </div>

        {logsLoading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        ) : executionLogs.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No execution logs found.
          </p>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Started At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Response
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {executionLogs.map((log: any) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getExecutionStatusColor(log.status)}`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(log.startedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {log.duration ? `${log.duration}ms` : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {log.responseStatus ? `${log.responseStatus}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Delete CRON Job
              </h3>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete "{cronJob.name}"? This action cannot be undone and will also delete all execution logs.
            </p>
            <div className="mt-6 flex items-center space-x-4">
              <button
                onClick={handleDeleteJob}
                disabled={deleteJobMutation.isPending}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {deleteJobMutation.isPending ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {(toggleJobMutation.error || executeJobMutation.error || deleteJobMutation.error) && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <div className="text-sm text-red-700 dark:text-red-400">
            An error occurred. Please try again.
          </div>
        </div>
      )}
    </div>
  );
}