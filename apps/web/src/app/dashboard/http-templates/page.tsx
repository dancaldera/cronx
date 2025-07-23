"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  PlusIcon,
  PlayIcon,
  TrashIcon,
  PencilIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

export default function HttpTemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const queryClient = useQueryClient();

  const {
    data: templates,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["httpTemplates"],
    queryFn: () => apiClient.getHttpTemplates(),
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteHttpTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["httpTemplates"] });
    },
  });

  const testTemplateMutation = useMutation({
    mutationFn: (id: string) => apiClient.testHttpTemplate(id),
    onSuccess: (result, templateId) => {
      setTestResults(prev => ({
        ...prev,
        [templateId]: result
      }));
    },
    onError: (error: any, templateId) => {
      setTestResults(prev => ({
        ...prev,
        [templateId]: {
          success: false,
          data: {
            error: error.message || "Test failed",
            isSuccess: false
          }
        }
      }));
    },
  });

  const handleDeleteTemplate = async (id: string) => {
    if (confirm("Are you sure you want to delete this HTTP template?")) {
      try {
        await deleteTemplateMutation.mutateAsync(id);
      } catch (error) {
        console.error("Failed to delete template:", error);
      }
    }
  };

  const handleTestTemplate = async (id: string) => {
    // Clear previous results for this template
    setTestResults(prev => ({
      ...prev,
      [id]: null
    }));
    
    try {
      await testTemplateMutation.mutateAsync(id);
    } catch (error) {
      // Error handling is done in the mutation onError
    }
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900",
      POST: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900",
      PUT: "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900",
      DELETE: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900",
      PATCH:
        "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900",
    };
    return (
      colors[method.toUpperCase()] ||
      "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700"
    );
  };

  const getAuthTypeDisplay = (authType: string | null) => {
    if (!authType) return "None";
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

  if (error) {
    return (
      <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
        <div className="text-sm text-red-700 dark:text-red-400">
          Error loading HTTP templates. Please try again.
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
            HTTP Templates
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage reusable HTTP request configurations for your CRON jobs
          </p>
        </div>
        <Link
          href="/dashboard/http-templates/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Template
        </Link>
      </div>

      {/* Templates List */}
      {!templates?.data || templates.data.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No HTTP templates
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by creating your first reusable HTTP template.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/http-templates/create"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Template
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-1 lg:grid-cols-2">
          {templates?.data?.map((template: any) => {
            const testResult = testResults[template.id];
            return (
            <div
              key={template.id}
              className="relative bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getMethodColor(template.method)}`}
                    >
                      {template.method}
                    </span>
                    {template.category && (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {template.category}
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {template.name}
                </h3>

                {template.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {template.description}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  <div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      URL:
                    </span>
                    <p className="text-sm text-gray-900 dark:text-white font-mono truncate">
                      {template.url}
                    </p>
                  </div>

                  <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                    <span>Auth: {getAuthTypeDisplay(template.authType)}</span>
                    <span>Timeout: {template.timeoutSeconds || 30}s</span>
                  </div>

                  {template.expectedStatusCodes && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Expected status:{" "}
                      </span>
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {Array.isArray(template.expectedStatusCodes)
                          ? template.expectedStatusCodes.join(", ")
                          : template.expectedStatusCodes}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700 relative z-10">
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestTemplate(template.id);
                      }}
                      disabled={testTemplateMutation.isPending}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 disabled:opacity-50"
                      title="Test template"
                    >
                      <PlayIcon className="h-4 w-4 mr-1" />
                      {testTemplateMutation.isPending && testTemplateMutation.variables === template.id ? "Testing..." : "Test"}
                    </button>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                      title="Duplicate template"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                      Clone
                    </button>
                  </div>

                  <div className="flex space-x-1">
                    <Link
                      href={`/dashboard/http-templates/${template.id}/edit`}
                      className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                      title="Edit template"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTemplate(template.id);
                      }}
                      disabled={deleteTemplateMutation.isPending}
                      className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
                      title="Delete template"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Test Results */}
                {testResult && (
                  <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4 relative z-10">
                    <div className="space-y-3">
                      {/* Test Result Status */}
                      <div className={`p-3 rounded-md ${testResult.data?.isSuccess ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
                        <div className={`text-sm font-medium ${testResult.data?.isSuccess ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                          {testResult.data?.isSuccess ? "✅ Test Passed" : "❌ Test Failed"}
                        </div>
                        
                        {testResult.data?.status && (
                          <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                            HTTP Status: <span className="font-mono">{testResult.data.status} {testResult.data.statusText}</span>
                          </div>
                        )}
                        
                        {testResult.data?.executionTime && (
                          <div className="text-xs text-gray-600 dark:text-gray-300">
                            Duration: <span className="font-mono">{testResult.data.executionTime}ms</span>
                          </div>
                        )}
                        
                        {testResult.data?.error && (
                          <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                            <span className="font-medium">Error:</span> {testResult.data.error}
                          </div>
                        )}
                      </div>

                      {/* Response Body (collapsed by default) */}
                      {testResult.data?.data && (
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                          <h5 className="text-xs font-medium text-gray-900 dark:text-white mb-2">
                            Response Body
                          </h5>
                          <pre className="text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 p-2 rounded overflow-x-auto max-h-24 overflow-y-auto">
                            {typeof testResult.data.data === 'string' 
                              ? testResult.data.data 
                              : JSON.stringify(testResult.data.data, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* Headers Summary */}
                      {testResult.data?.headers && (
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                          <h5 className="text-xs font-medium text-gray-900 dark:text-white mb-2">
                            Response Headers ({Object.keys(testResult.data.headers).length})
                          </h5>
                          <div className="space-y-1 max-h-20 overflow-y-auto">
                            {Object.entries(testResult.data.headers).slice(0, 3).map(([key, value]) => (
                              <div key={key} className="flex justify-between text-xs">
                                <span className="font-mono text-gray-600 dark:text-gray-400 truncate">{key}:</span>
                                <span className="font-mono text-gray-900 dark:text-white ml-2 truncate max-w-xs">
                                  {String(value)}
                                </span>
                              </div>
                            ))}
                            {Object.keys(testResult.data.headers).length > 3 && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                ... and {Object.keys(testResult.data.headers).length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Clickable area for navigation */}
              <div 
                className="absolute inset-0 cursor-pointer z-0"
                onClick={() => window.location.href = `/dashboard/http-templates/${template.id}`}
              />
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
