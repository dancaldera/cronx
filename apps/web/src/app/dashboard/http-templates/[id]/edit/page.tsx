"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiClient } from "@/lib/api-client";
import {
  ArrowLeftIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  ClockIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

// Form validation schema
const httpTemplateFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  description: z.string().optional(),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).default("GET"),
  url: z.string().url("Please enter a valid URL"),
  headers: z.string().optional(), // JSON string
  body: z.string().optional(),
  authType: z.enum(["none", "bearer", "basic", "api_key"]).default("none"),
  authConfig: z.string().optional(), // JSON string
  timeoutSeconds: z.number().int().min(1).max(300).default(30),
  followRedirects: z.boolean().default(true),
  validateSsl: z.boolean().default(true),
  expectedStatusCodes: z.string().default("200"), // Comma-separated string
});

type HttpTemplateFormData = z.infer<typeof httpTemplateFormSchema>;

interface EditHttpTemplatePageProps {
  params: { id: string };
}

export default function EditHttpTemplatePage({ params }: EditHttpTemplatePageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    getValues,
    reset,
  } = useForm<HttpTemplateFormData>({
    resolver: zodResolver(httpTemplateFormSchema),
  });

  // Fetch existing template data
  const {
    data: templateResponse,
    isLoading: templateLoading,
    error: templateError,
  } = useQuery({
    queryKey: ["httpTemplate", params.id],
    queryFn: () => apiClient.getHttpTemplate(params.id),
    enabled: !!params.id,
  });

  // Populate form with existing data
  useEffect(() => {
    if (templateResponse?.data) {
      const template = templateResponse.data;
      reset({
        name: template.name,
        description: template.description || "",
        method: template.method,
        url: template.url,
        headers: template.headers ? JSON.stringify(template.headers, null, 2) : "",
        body: template.body || "",
        authType: template.authType || "none",
        authConfig: template.authConfig ? JSON.stringify(template.authConfig, null, 2) : "",
        timeoutSeconds: template.timeoutSeconds || 30,
        followRedirects: template.followRedirects,
        validateSsl: template.validateSsl,
        expectedStatusCodes: Array.isArray(template.expectedStatusCodes)
          ? template.expectedStatusCodes.join(", ")
          : String(template.expectedStatusCodes || "200"),
      });
    }
  }, [templateResponse, reset]);

  const updateTemplateMutation = useMutation({
    mutationFn: (data: any) => apiClient.updateHttpTemplate(params.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["httpTemplate", params.id] });
      queryClient.invalidateQueries({ queryKey: ["httpTemplates"] });
      router.push(`/dashboard/http-templates/${params.id}`);
    },
    onError: (error: any) => {
      console.error("Failed to update HTTP template:", error);
    },
  });

  const testTemplateMutation = useMutation({
    mutationFn: (data: any) => {
      // Test with the form data
      return apiClient.testHttpTemplateData(data);
    },
  });

  const onSubmit = async (data: HttpTemplateFormData) => {
    try {
      // Parse JSON fields
      const processedData = {
        ...data,
        headers: data.headers ? JSON.parse(data.headers) : {},
        authConfig: data.authConfig ? JSON.parse(data.authConfig) : {},
        expectedStatusCodes: data.expectedStatusCodes
          .split(",")
          .map((code) => parseInt(code.trim()))
          .filter((code) => !isNaN(code)),
      };

      await updateTemplateMutation.mutateAsync(processedData);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleTestTemplate = async () => {
    try {
      const formData = getValues();
      const processedData = {
        ...formData,
        headers: formData.headers ? JSON.parse(formData.headers) : {},
        authConfig: formData.authConfig ? JSON.parse(formData.authConfig) : {},
        expectedStatusCodes: formData.expectedStatusCodes
          .split(",")
          .map((code) => parseInt(code.trim()))
          .filter((code) => !isNaN(code)),
      };

      const result = await testTemplateMutation.mutateAsync(processedData);
      setTestResult(result);
    } catch (error: any) {
      setTestResult({
        success: false,
        error: error.message || "Test failed",
      });
    }
  };

  const selectedMethod = watch("method");
  const selectedAuthType = watch("authType");

  // Common headers suggestions
  const commonHeaders = [
    { key: "Content-Type", value: "application/json" },
    { key: "Accept", value: "application/json" },
    { key: "User-Agent", value: "CronX/1.0" },
    { key: "X-API-Version", value: "v1" },
  ];

  const renderAuthConfig = () => {
    switch (selectedAuthType) {
      case "bearer":
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bearer Token Configuration
            </label>
            <textarea
              {...register("authConfig")}
              rows={3}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white font-mono sm:text-sm"
              placeholder='{"token": "your-bearer-token-here"}'
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              JSON format: {"{"}"token": "your-bearer-token"{"}"}
            </p>
          </div>
        );
      case "basic":
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Basic Auth Configuration
            </label>
            <textarea
              {...register("authConfig")}
              rows={3}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white font-mono sm:text-sm"
              placeholder='{"username": "user", "password": "pass"}'
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              JSON format: {"{"}"username": "user", "password": "pass"{"}"}
            </p>
          </div>
        );
      case "api_key":
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Key Configuration
            </label>
            <textarea
              {...register("authConfig")}
              rows={3}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white font-mono sm:text-sm"
              placeholder='{"header": "X-API-Key", "key": "your-api-key"}'
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              JSON format: {"{"}"header": "X-API-Key", "key": "your-api-key"{"}"}
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  if (templateLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  if (templateError || !templateResponse?.data) {
    return (
      <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
        <div className="text-sm text-red-700 dark:text-red-400">
          Error loading HTTP template. Please try again.
        </div>
      </div>
    );
  }

  const template = templateResponse.data;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href={`/dashboard/http-templates/${params.id}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Template Details
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Edit HTTP Template
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Update your HTTP request configuration
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          {/* Basic Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Basic Information
            </h3>

            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Template Name
              </label>
              <input
                type="text"
                id="name"
                {...register("name")}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                placeholder="e.g., API Health Check"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Description (Optional)
              </label>
              <textarea
                id="description"
                rows={3}
                {...register("description")}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                placeholder="Brief description of what this template does..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* HTTP Configuration */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <GlobeAltIcon className="h-5 w-5 mr-2" />
              HTTP Configuration
            </h3>

            {/* Method and URL */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
              <div>
                <label
                  htmlFor="method"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Method
                </label>
                <select
                  id="method"
                  {...register("method")}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>
                {errors.method && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.method.message}
                  </p>
                )}
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor="url"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  URL
                </label>
                <input
                  type="url"
                  id="url"
                  {...register("url")}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  placeholder="https://api.example.com/health"
                />
                {errors.url && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.url.message}
                  </p>
                )}
              </div>
            </div>

            {/* Headers */}
            <div>
              <label
                htmlFor="headers"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Headers (JSON format)
              </label>
              <textarea
                id="headers"
                rows={4}
                {...register("headers")}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white font-mono sm:text-sm"
                placeholder='{"Content-Type": "application/json", "Accept": "application/json"}'
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Quick add:
                </span>
                {commonHeaders.map((header) => (
                  <button
                    key={header.key}
                    type="button"
                    onClick={() => {
                      const current = getValues("headers");
                      const currentHeaders = current ? JSON.parse(current) : {};
                      currentHeaders[header.key] = header.value;
                      setValue("headers", JSON.stringify(currentHeaders, null, 2));
                    }}
                    className="inline-flex items-center px-2 py-1 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    {header.key}
                  </button>
                ))}
              </div>
              {errors.headers && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.headers.message}
                </p>
              )}
            </div>

            {/* Body (for POST/PUT/PATCH) */}
            {selectedMethod !== "GET" && selectedMethod !== "DELETE" && (
              <div>
                <label
                  htmlFor="body"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Request Body
                </label>
                <textarea
                  id="body"
                  rows={6}
                  {...register("body")}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white font-mono sm:text-sm"
                  placeholder='{"key": "value"}'
                />
                {errors.body && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.body.message}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Authentication */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <ShieldCheckIcon className="h-5 w-5 mr-2" />
              Authentication
            </h3>

            {/* Auth Type */}
            <div>
              <label
                htmlFor="authType"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Authentication Type
              </label>
              <select
                id="authType"
                {...register("authType")}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              >
                <option value="none">None</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
                <option value="api_key">API Key</option>
              </select>
              {errors.authType && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.authType.message}
                </p>
              )}
            </div>

            {/* Auth Configuration */}
            {selectedAuthType !== "none" && renderAuthConfig()}
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <svg
                className={`h-4 w-4 mr-1 transform transition-transform ${
                  showAdvanced ? "rotate-90" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              Advanced Settings
            </button>

            {showAdvanced && (
              <div className="space-y-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                {/* Timeout */}
                <div>
                  <label
                    htmlFor="timeoutSeconds"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    <ClockIcon className="h-4 w-4 inline mr-1" />
                    Timeout (seconds)
                  </label>
                  <input
                    type="number"
                    id="timeoutSeconds"
                    min="1"
                    max="300"
                    {...register("timeoutSeconds", { valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  />
                  {errors.timeoutSeconds && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.timeoutSeconds.message}
                    </p>
                  )}
                </div>

                {/* Expected Status Codes */}
                <div>
                  <label
                    htmlFor="expectedStatusCodes"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Expected Status Codes
                  </label>
                  <input
                    type="text"
                    id="expectedStatusCodes"
                    {...register("expectedStatusCodes")}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    placeholder="200, 201, 204"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Comma-separated list of acceptable HTTP status codes
                  </p>
                  {errors.expectedStatusCodes && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.expectedStatusCodes.message}
                    </p>
                  )}
                </div>

                {/* Checkboxes */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="followRedirects"
                      type="checkbox"
                      {...register("followRedirects")}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <label
                      htmlFor="followRedirects"
                      className="ml-2 block text-sm text-gray-900 dark:text-white"
                    >
                      Follow redirects automatically
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="validateSsl"
                      type="checkbox"
                      {...register("validateSsl")}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <label
                      htmlFor="validateSsl"
                      className="ml-2 block text-sm text-gray-900 dark:text-white"
                    >
                      Validate SSL certificates
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Current Template Stats */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Template Information
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Created:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {new Date(template.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Updated:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {new Date(template.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Test Template */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Test Template
            </h4>
            <button
              type="button"
              onClick={handleTestTemplate}
              disabled={testTemplateMutation.isPending}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <PlayIcon className="h-4 w-4 mr-1" />
              {testTemplateMutation.isPending ? "Testing..." : "Test Now"}
            </button>
          </div>
          
          {testResult && (
            <div className="mt-4 space-y-3">
              {/* Test Result Status */}
              <div className={`p-3 rounded-md ${testResult.data?.isSuccess ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
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
                <div className="bg-white dark:bg-gray-800 p-3 rounded-md">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Response Headers
                  </h5>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {Object.entries(testResult.data.headers).slice(0, 10).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-xs">
                        <span className="font-mono text-gray-600 dark:text-gray-400">{key}:</span>
                        <span className="font-mono text-gray-900 dark:text-white ml-2 truncate">
                          {String(value)}
                        </span>
                      </div>
                    ))}
                    {Object.keys(testResult.data.headers).length > 10 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        ... and {Object.keys(testResult.data.headers).length - 10} more headers
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Response Body */}
              {testResult.data?.data && (
                <div className="bg-white dark:bg-gray-800 p-3 rounded-md">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Response Body
                  </h5>
                  <pre className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-2 rounded overflow-x-auto max-h-40 overflow-y-auto">
                    {typeof testResult.data.data === 'string' 
                      ? testResult.data.data 
                      : JSON.stringify(testResult.data.data, null, 2)}
                  </pre>
                </div>
              )}

              {/* Expected vs Actual Status */}
              {testResult.data?.expectedStatusCodes && (
                <div className="bg-white dark:bg-gray-800 p-3 rounded-md">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Status Code Validation
                  </h5>
                  <div className="text-sm">
                    <div className="text-gray-600 dark:text-gray-400">
                      Expected: <span className="font-mono">{testResult.data.expectedStatusCodes.join(', ')}</span>
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Actual: <span className="font-mono">{testResult.data.status}</span>
                    </div>
                    <div className={`mt-1 ${testResult.data.isSuccess ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {testResult.data.isSuccess ? "✅ Status code matches" : "❌ Status code doesn't match"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {testTemplateMutation.error && (
            <div className="mt-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20">
              <div className="text-sm text-red-600 dark:text-red-400">
                <span className="font-medium">Test Error:</span> Failed to execute test. Please check your configuration.
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center space-x-4">
          <button
            type="submit"
            disabled={isSubmitting || updateTemplateMutation.isPending}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting || updateTemplateMutation.isPending
              ? "Updating..."
              : "Update Template"}
          </button>
          <Link
            href={`/dashboard/http-templates/${params.id}`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </Link>
        </div>

        {/* Error Display */}
        {updateTemplateMutation.error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <div className="text-sm text-red-700 dark:text-red-400">
              Failed to update HTTP template. Please check your inputs and try again.
            </div>
          </div>
        )}
      </form>
    </div>
  );
}