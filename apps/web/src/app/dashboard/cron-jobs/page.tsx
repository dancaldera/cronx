"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  PlusIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";
import {
  PauseIcon as PauseIconSolid,
} from "@heroicons/react/24/solid";
import Link from "next/link";
import { useCronRealtime } from "@/hooks/use-cron-realtime";
import { RealtimeStats } from "@/components/cron-jobs/realtime-stats";
import { LastResponseModal } from "@/components/cron-jobs/last-response-modal";

export default function CronJobsPage() {
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [lastResponseModal, setLastResponseModal] = useState<{
    isOpen: boolean;
    jobName: string;
    responseData: any;
  }>({
    isOpen: false,
    jobName: '',
    responseData: null,
  });
  const queryClient = useQueryClient();
  
  // Set up real-time updates
  const { realtimeStats } = useCronRealtime({
    refreshInterval: 3000, // Update every 3 seconds
    enableRealtimeUpdates: true,
  });

  const {
    data: cronJobs,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["cronJobs"],
    queryFn: () => apiClient.getCronJobs(),
  });

  const toggleJobMutation = useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) =>
      apiClient.toggleCronJob(id, isEnabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cronJobs"] });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteCronJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cronJobs"] });
    },
  });

  const executeJobMutation = useMutation({
    mutationFn: (id: string) => apiClient.executeCronJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cronJobs"] });
    },
  });

  const handleToggleJob = async (id: string, currentStatus: boolean) => {
    try {
      await toggleJobMutation.mutateAsync({ id, isEnabled: !currentStatus });
    } catch (error) {
      console.error("Failed to toggle job:", error);
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (confirm("Are you sure you want to delete this CRON job?")) {
      try {
        await deleteJobMutation.mutateAsync(id);
      } catch (error) {
        console.error("Failed to delete job:", error);
      }
    }
  };

  const handleExecuteJob = async (id: string) => {
    try {
      await executeJobMutation.mutateAsync(id);
    } catch (error) {
      console.error("Failed to execute job:", error);
    }
  };

  const handleViewLastResponse = (jobName: string, jobId: string) => {
    const responseData = realtimeStats[jobId]?.lastResponse;
    if (responseData) {
      setLastResponseModal({
        isOpen: true,
        jobName,
        responseData,
      });
    }
  };

  const formatNextExecution = (date: string | null) => {
    if (!date) return "Not scheduled";
    return new Date(date).toLocaleString();
  };

  const getStatusColor = (isEnabled: boolean) => {
    return isEnabled
      ? "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900"
      : "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
        <div className="text-sm text-red-700 dark:text-red-400">
          Error loading CRON jobs. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            CRON Jobs
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage your scheduled HTTP requests and automation tasks
          </p>
        </div>
        <Link
          href="/dashboard/cron-jobs/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create CRON Job
        </Link>
      </div>

      {/* Jobs List */}
      {!cronJobs?.data || cronJobs.data.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No CRON jobs
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by creating your first scheduled job.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/cron-jobs/create"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create CRON Job
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Job
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Schedule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Next Execution
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {cronJobs?.data?.map((job: any) => (
                  <tr
                    key={job.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {job.name}
                        </div>
                        {job.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {job.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white font-mono">
                        {job.cronExpression}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {job.timezone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.isEnabled)}`}
                      >
                        {job.isEnabled ? "Active" : "Paused"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="space-y-1">
                        <div className="text-xs font-mono">
                          {formatNextExecution(realtimeStats[job.id]?.nextExecution ?? job.nextExecution)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <RealtimeStats
                        executionCount={realtimeStats[job.id]?.executionCount ?? job.executionCount}
                        successCount={realtimeStats[job.id]?.successCount ?? job.successCount}
                        failureCount={realtimeStats[job.id]?.failureCount ?? job.failureCount}
                        nextExecution={realtimeStats[job.id]?.nextExecution ?? job.nextExecution}
                        lastExecution={realtimeStats[job.id]?.lastExecution ?? job.lastExecution}
                        lastResponse={realtimeStats[job.id]?.lastResponse}
                        isEnabled={job.isEnabled}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Execute Now */}
                        <button
                          onClick={() => handleExecuteJob(job.id)}
                          disabled={executeJobMutation.isPending}
                          className="inline-flex items-center justify-center w-8 h-8 text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 disabled:opacity-50 transition-colors duration-200"
                          title="Execute now"
                        >
                          <BoltIcon className="h-5 w-5" />
                        </button>
                        
                        {/* Pause/Resume */}
                        <button
                          onClick={() => handleToggleJob(job.id, job.isEnabled)}
                          disabled={toggleJobMutation.isPending}
                          className={`inline-flex items-center justify-center w-8 h-8 disabled:opacity-50 transition-colors duration-200 ${
                            job.isEnabled 
                              ? "text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300" 
                              : "text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                          }`}
                          title={job.isEnabled ? "Pause job" : "Resume job"}
                        >
                          {job.isEnabled ? (
                            <PauseIconSolid className="h-5 w-5" />
                          ) : (
                            <PlayIcon className="h-5 w-5" />
                          )}
                        </button>
                        
                        {/* View Last Response */}
                        <button
                          onClick={() => handleViewLastResponse(job.name, job.id)}
                          disabled={!realtimeStats[job.id]?.lastResponse}
                          className="inline-flex items-center justify-center w-8 h-8 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-30 transition-colors duration-200"
                          title="View last response"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        
                        {/* Edit */}
                        <Link
                          href={`/dashboard/cron-jobs/${job.id}/edit`}
                          className="inline-flex items-center justify-center w-8 h-8 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 transition-colors duration-200"
                          title="Edit job"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </Link>
                        
                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          disabled={deleteJobMutation.isPending}
                          className="inline-flex items-center justify-center w-8 h-8 text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 disabled:opacity-50 transition-colors duration-200"
                          title="Delete job"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Last Response Modal */}
      <LastResponseModal
        isOpen={lastResponseModal.isOpen}
        onClose={() => setLastResponseModal({ ...lastResponseModal, isOpen: false })}
        cronJobName={lastResponseModal.jobName}
        responseData={lastResponseModal.responseData}
      />
    </div>
  );
}
