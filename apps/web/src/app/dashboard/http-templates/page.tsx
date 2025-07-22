'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { PlusIcon, PlayIcon, TrashIcon, PencilIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';

export default function HttpTemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: templates, isLoading, error } = useQuery({
    queryKey: ['httpTemplates'],
    queryFn: () => apiClient.getHttpTemplates(),
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteHttpTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['httpTemplates'] });
    },
  });

  const testTemplateMutation = useMutation({
    mutationFn: (id: string) => apiClient.testHttpTemplate(id),
  });

  const handleDeleteTemplate = async (id: string) => {
    if (confirm('Are you sure you want to delete this HTTP template?')) {
      try {
        await deleteTemplateMutation.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete template:', error);
      }
    }
  };

  const handleTestTemplate = async (id: string) => {
    try {
      const result = await testTemplateMutation.mutateAsync(id);
      alert(`Test Result: ${result.success ? 'Success' : 'Failed'}\nStatus: ${result.status}`);
    } catch (error: any) {
      alert(`Test Failed: ${error.message}`);
    }
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'text-green-600 bg-green-100',
      POST: 'text-blue-600 bg-blue-100',
      PUT: 'text-yellow-600 bg-yellow-100',
      DELETE: 'text-red-600 bg-red-100',
      PATCH: 'text-purple-600 bg-purple-100',
    };
    return colors[method.toUpperCase()] || 'text-gray-600 bg-gray-100';
  };

  const getAuthTypeDisplay = (authType: string | null) => {
    if (!authType) return 'None';
    return authType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">
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
          <h1 className="text-2xl font-semibold text-gray-900">HTTP Templates</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage reusable HTTP request configurations for your CRON jobs
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Template
        </button>
      </div>

      {/* Templates List */}
      {!templates?.data || templates.data.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No HTTP templates</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first reusable HTTP template.
          </p>
          <div className="mt-6">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Template
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates?.data?.map((template: any) => (
            <div key={template.id} className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getMethodColor(template.method)}`}>
                      {template.method}
                    </span>
                    {template.category && (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                        {template.category}
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-medium text-gray-900 mb-2">{template.name}</h3>
                
                {template.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>
                )}

                <div className="space-y-2 mb-4">
                  <div>
                    <span className="text-xs font-medium text-gray-500">URL:</span>
                    <p className="text-sm text-gray-900 font-mono truncate">{template.url}</p>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Auth: {getAuthTypeDisplay(template.authType)}</span>
                    <span>Timeout: {template.timeoutSeconds || 30}s</span>
                  </div>
                  
                  {template.expectedStatusCodes && (
                    <div>
                      <span className="text-xs font-medium text-gray-500">Expected status: </span>
                      <span className="text-xs text-gray-700">
                        {Array.isArray(template.expectedStatusCodes) 
                          ? template.expectedStatusCodes.join(', ')
                          : template.expectedStatusCodes}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleTestTemplate(template.id)}
                      disabled={testTemplateMutation.isPending}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                      title="Test template"
                    >
                      <PlayIcon className="h-4 w-4 mr-1" />
                      Test
                    </button>
                    <button
                      className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-gray-600 hover:text-gray-800"
                      title="Duplicate template"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                      Clone
                    </button>
                  </div>
                  
                  <div className="flex space-x-1">
                    <button
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Edit template"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      disabled={deleteTemplateMutation.isPending}
                      className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
                      title="Delete template"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}