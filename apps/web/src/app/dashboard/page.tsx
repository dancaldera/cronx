'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  // Fetch dashboard statistics
  const { data: cronJobsData } = useQuery({
    queryKey: ['cron-jobs'],
    queryFn: () => apiClient.getCronJobs(),
  });

  const { data: httpTemplatesData } = useQuery({
    queryKey: ['http-templates'],
    queryFn: () => apiClient.getHttpTemplates(),
  });

  const { data: executionStats } = useQuery({
    queryKey: ['execution-stats', '7d'],
    queryFn: () => apiClient.getExecutionStats({ period: '7d' }),
  });

  const cronJobs = cronJobsData?.data || [];
  const httpTemplates = httpTemplatesData?.data || [];
  const stats = executionStats?.data || {};

  const activeCronJobs = cronJobs.filter((job: any) => job.isEnabled);
  const recentExecutions = stats.totalExecutions || 0;
  const successRate = stats.successRate || 0;

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.firstName || user?.username}! 👋
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Here's an overview of your HTTP automation platform
          </p>
        </div>

        {/* Statistics cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">⏰</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active CRON Jobs
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {activeCronJobs.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">🌐</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      HTTP Templates
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {httpTemplates.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">📊</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Executions (7d)
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {recentExecutions.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-emerald-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">✓</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Success Rate
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {successRate.toFixed(1)}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent CRON Jobs */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Recent CRON Jobs
                </h3>
                <Link
                  href="/cron-jobs"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  View all
                </Link>
              </div>
              
              <div className="space-y-3">
                {cronJobs.slice(0, 5).map((job: any) => (
                  <div key={job.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${job.isEnabled ? 'bg-green-400' : 'bg-gray-400'} mr-3`}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{job.name}</p>
                        <p className="text-xs text-gray-500">{job.cronExpression}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      job.isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {job.isEnabled ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
                
                {cronJobs.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">No CRON jobs yet</p>
                    <Link
                      href="/cron-jobs"
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Create your first job
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              
              <div className="grid grid-cols-1 gap-3">
                <Link
                  href="/cron-jobs/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  ⏰ Create CRON Job
                </Link>
                
                <Link
                  href="/http-templates/new"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  🌐 New HTTP Template
                </Link>
                
                <Link
                  href="/execution-logs"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  📋 View Execution Logs
                </Link>
                
                <Link
                  href="/analytics"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  📈 View Analytics
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}