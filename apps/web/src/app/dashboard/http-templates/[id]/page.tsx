"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  ArrowLeftIcon,
  PlayIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

interface HttpTemplateDetailPageProps {
  params: { id: string };
}

export default function HttpTemplateDetailPage({ params }: HttpTemplateDetailPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const {
    data: templateResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["httpTemplate", params.id],
    queryFn: () => apiClient.getHttpTemplate(params.id),
    enabled: !!params.id,
  });

  const testTemplateMutation = useMutation({
    mutationFn: () => apiClient.testHttpTemplate(params.id),
    onSuccess: (result) => {
      setTestResult(result);
    },
    onError: (error: any) => {
      setTestResult({
        success: false,
        error: error.message || "Test failed",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: () => apiClient.deleteHttpTemplate(params.id),
    onSuccess: () => {
      router.push("/dashboard/http-templates");
    },
  });

  const handleTestTemplate = async () => {
    setTestResult(null);
    try {
      await testTemplateMutation.mutateAsync();
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleDeleteTemplate = async () => {
    try {
      await deleteTemplateMutation.mutateAsync();
    } catch (error) {
      console.error("Failed to delete template:", error);
    }
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900",
      POST: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900",
      PUT: "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900",
      DELETE: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900",
      PATCH: "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900",
    };
    return (
      colors[method.toUpperCase()] ||
      "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700"
    );
  };

  const getAuthTypeDisplay = (authType: string | null) => {
    if (!authType || authType === "none") return "None";
    return authType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  if (error || !templateResponse?.data) {
    return (
      <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
        <div className="text-sm text-red-700 dark:text-red-400">
          Error loading HTTP template details. Please try again.
        </div>
      </div>
    );
  }

  const template = templateResponse.data;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/http-templates"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Templates
          </Link>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleTestTemplate}
            disabled={testTemplateMutation.isPending}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <PlayIcon className="h-4 w-4 mr-1" />
            {testTemplateMutation.isPending ? "Testing..." : "Test Template"}
          </button>
          <button
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            title="Clone template"
          >
            <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
            Clone
          </button>
          <Link
            href={`/dashboard/http-templates/${params.id}/edit`}
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

      {/* Template Overview */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {template.name}
            </h1>
            {template.description && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {template.description}
              </p>
            )}
          </div>
          <span
            className={`inline-flex px-3 py-1 text-sm font-semibold rounded-md ${getMethodColor(template.method)}`}
          >
            {template.method}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center">
              <GlobeAltIcon className="h-5 w-5 text-gray-400" />
              <h3 className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                URL
              </h3>
            </div>
            <p className="mt-2 text-sm text-gray-900 dark:text-white font-mono break-all">
              {template.url}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-5 w-5 text-gray-400" />
              <h3 className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                Authentication
              </h3>
            </div>
            <p className="mt-2 text-sm text-gray-900 dark:text-white">
              {getAuthTypeDisplay(template.authType)}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center">
              <ClockIcon className="h-5 w-5 text-gray-400" />
              <h3 className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                Timeout
              </h3>
            </div>
            <p className="mt-2 text-sm text-gray-900 dark:text-white">
              {template.timeoutSeconds || 30}s
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Expected Status
            </h3>
            <p className="mt-2 text-sm text-gray-900 dark:text-white">
              {Array.isArray(template.expectedStatusCodes)
                ? template.expectedStatusCodes.join(", ")
                : template.expectedStatusCodes || "200"}
            </p>
          </div>
        </div>
      </div>

      {/* HTTP Configuration Details */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Headers */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Headers
          </h3>
          {template.headers && Object.keys(template.headers).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(template.headers).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {key}:
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No custom headers configured
            </p>
          )}
        </div>

        {/* Request Body */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Request Body
          </h3>
          {template.body ? (
            <pre className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-md overflow-x-auto">
              {template.body}
            </pre>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No request body configured
            </p>
          )}
        </div>
      </div>

      {/* Authentication Configuration */}
      {template.authType !== "none" && template.authConfig && (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Authentication Configuration
          </h3>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Authentication type: <span className="font-medium">{getAuthTypeDisplay(template.authType)}</span>
            </p>
            <pre className="text-sm text-gray-900 dark:text-white">
              {JSON.stringify(template.authConfig, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Advanced Settings */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Advanced Settings
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Follow Redirects
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {template.followRedirects ? "Yes" : "No"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Validate SSL
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {template.validateSsl ? "Yes" : "No"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Created
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {new Date(template.createdAt).toLocaleDateString()}
            </dd>
          </div>
        </div>
      </div>

      {/* Test Results */}
      {testResult && (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Test Results
          </h3>
          <div className="space-y-4">
            {/* Test Result Status */}
            <div className={`p-4 rounded-md ${testResult.data?.isSuccess ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
              <div className={`text-sm font-medium ${testResult.data?.isSuccess ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {testResult.data?.isSuccess ? "✅ Test Passed" : "❌ Test Failed"}
              </div>
              
              {testResult.data?.status && (
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  HTTP Status: <span className="font-mono">{testResult.data.status} {testResult.data.statusText}</span>
                </div>
              )}
              
              {testResult.data?.executionTime && (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Duration: <span className="font-mono">{testResult.data.executionTime}ms</span>
                </div>
              )}
              
              {testResult.data?.error && (
                <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                  <span className="font-medium">Error:</span> {testResult.data.error}
                </div>
              )}
            </div>

            {/* Response Headers */}
            {testResult.data?.headers && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Response Headers ({Object.keys(testResult.data.headers).length})
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {Object.entries(testResult.data.headers).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-start py-1 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                      <span className="font-mono text-sm text-gray-600 dark:text-gray-400 font-medium">
                        {key}:
                      </span>
                      <span className="font-mono text-sm text-gray-900 dark:text-white ml-4 text-right break-all">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Response Body */}
            {testResult.data?.data && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Response Body
                </h4>
                <pre className="text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded border overflow-x-auto max-h-80 overflow-y-auto">
                  {typeof testResult.data.data === 'string' 
                    ? testResult.data.data 
                    : JSON.stringify(testResult.data.data, null, 2)}
                </pre>
              </div>
            )}

            {/* Expected vs Actual Status */}
            {testResult.data?.expectedStatusCodes && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Status Code Validation
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Expected:</span>
                    <span className="font-mono text-sm text-gray-900 dark:text-white">
                      {testResult.data.expectedStatusCodes.join(', ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Actual:</span>
                    <span className="font-mono text-sm text-gray-900 dark:text-white">
                      {testResult.data.status}
                    </span>
                  </div>
                  <div className={`text-sm font-medium ${testResult.data.isSuccess ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {testResult.data.isSuccess ? "✅ Status code matches expected values" : "❌ Status code doesn't match expected values"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Delete HTTP Template
              </h3>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete "{template.name}"? This action cannot be undone and may affect CRON jobs that use this template.
            </p>
            <div className="mt-6 flex items-center space-x-4">
              <button
                onClick={handleDeleteTemplate}
                disabled={deleteTemplateMutation.isPending}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {deleteTemplateMutation.isPending ? "Deleting..." : "Delete"}
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
      {(testTemplateMutation.error || deleteTemplateMutation.error) && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <div className="text-sm text-red-700 dark:text-red-400">
            An error occurred. Please try again.
          </div>
        </div>
      )}
    </div>
  );
}