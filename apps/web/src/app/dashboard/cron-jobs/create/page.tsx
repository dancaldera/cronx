"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiClient } from "@/lib/api-client";
import {
  ArrowLeftIcon,
  ClockIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

// Form validation schema
const cronJobFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  description: z.string().optional(),
  cronExpression: z.string().min(1, "CRON expression is required"),
  timezone: z.string().default("UTC"),
  httpTemplateId: z.string().uuid("Please select an HTTP template"),
  isEnabled: z.boolean().default(true),
  retryAttempts: z.number().int().min(0).max(10).default(3),
  timeoutSeconds: z.number().int().min(1).max(300).default(30),
});

type CronJobFormData = z.infer<typeof cronJobFormSchema>;

export default function CreateCronJobPage() {
  const router = useRouter();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<CronJobFormData>({
    resolver: zodResolver(cronJobFormSchema),
    defaultValues: {
      isEnabled: true,
      retryAttempts: 3,
      timeoutSeconds: 30,
      timezone: "UTC",
    },
  });

  // Fetch HTTP templates for the dropdown
  const { data: templatesResponse, isLoading: templatesLoading } = useQuery({
    queryKey: ["httpTemplates"],
    queryFn: () => apiClient.getHttpTemplates(),
  });

  const createCronJobMutation = useMutation({
    mutationFn: (data: CronJobFormData) => apiClient.createCronJob(data),
    onSuccess: () => {
      router.push("/dashboard/cron-jobs");
    },
    onError: (error: any) => {
      console.error("Failed to create CRON job:", error);
    },
  });

  const onSubmit = async (data: CronJobFormData) => {
    try {
      await createCronJobMutation.mutateAsync(data);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const cronExpression = watch("cronExpression");

  // Common CRON expressions for quick selection
  const commonExpressions = [
    { label: "Every minute", value: "* * * * *" },
    { label: "Every 5 minutes", value: "*/5 * * * *" },
    { label: "Every hour", value: "0 * * * *" },
    { label: "Every day at midnight", value: "0 0 * * *" },
    { label: "Every week on Sunday", value: "0 0 * * 0" },
    { label: "Every month on 1st", value: "0 0 1 * *" },
  ];

  // Timezone options
  const timezones = [
    { label: "UTC", value: "UTC" },
    { label: "America/New_York", value: "America/New_York" },
    { label: "America/Chicago", value: "America/Chicago" },
    { label: "America/Denver", value: "America/Denver" },
    { label: "America/Los_Angeles", value: "America/Los_Angeles" },
    { label: "Europe/London", value: "Europe/London" },
    { label: "Europe/Paris", value: "Europe/Paris" },
    { label: "Asia/Tokyo", value: "Asia/Tokyo" },
    { label: "Asia/Shanghai", value: "Asia/Shanghai" },
    { label: "Australia/Sydney", value: "Australia/Sydney" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/cron-jobs"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to CRON Jobs
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Create CRON Job
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Schedule a new HTTP request automation task
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
                Job Name
              </label>
              <input
                type="text"
                id="name"
                {...register("name")}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                placeholder="e.g., Daily Health Check"
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
                placeholder="Brief description of what this job does..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* HTTP Template Selection */}
            <div>
              <label
                htmlFor="httpTemplateId"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                HTTP Template
              </label>
              <select
                id="httpTemplateId"
                {...register("httpTemplateId")}
                disabled={templatesLoading}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              >
                <option value="">
                  {templatesLoading ? "Loading templates..." : "Select a template"}
                </option>
                {templatesResponse?.data?.map((template: any) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.method} {template.url})
                  </option>
                ))}
              </select>
              {errors.httpTemplateId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.httpTemplateId.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Schedule Configuration */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <ClockIcon className="h-5 w-5 mr-2" />
              Schedule Configuration
            </h3>

            {/* CRON Expression */}
            <div>
              <label
                htmlFor="cronExpression"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                CRON Expression
              </label>
              <div className="mt-1 space-y-2">
                <input
                  type="text"
                  id="cronExpression"
                  {...register("cronExpression")}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white font-mono sm:text-sm"
                  placeholder="0 0 * * *"
                />
                {errors.cronExpression && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.cronExpression.message}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Format: minute hour day month weekday (e.g., "0 0 * * *" for daily at midnight)
                </p>
              </div>

              {/* Quick Selection */}
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quick Select:
                </p>
                <div className="flex flex-wrap gap-2">
                  {commonExpressions.map((expr) => (
                    <button
                      key={expr.value}
                      type="button"
                      onClick={() => setValue("cronExpression", expr.value)}
                      className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      {expr.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Timezone */}
            <div>
              <label
                htmlFor="timezone"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                <GlobeAltIcon className="h-4 w-4 inline mr-1" />
                Timezone
              </label>
              <select
                id="timezone"
                {...register("timezone")}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              >
                {timezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              {errors.timezone && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.timezone.message}
                </p>
              )}
            </div>

            {/* Enable/Disable */}
            <div className="flex items-center">
              <input
                id="isEnabled"
                type="checkbox"
                {...register("isEnabled")}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label
                htmlFor="isEnabled"
                className="ml-2 block text-sm text-gray-900 dark:text-white"
              >
                Enable job immediately after creation
              </label>
            </div>
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
                {/* Retry Attempts */}
                <div>
                  <label
                    htmlFor="retryAttempts"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Retry Attempts
                  </label>
                  <input
                    type="number"
                    id="retryAttempts"
                    min="0"
                    max="10"
                    {...register("retryAttempts", { valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Number of times to retry failed executions (0-10)
                  </p>
                  {errors.retryAttempts && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.retryAttempts.message}
                    </p>
                  )}
                </div>

                {/* Timeout */}
                <div>
                  <label
                    htmlFor="timeoutSeconds"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
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
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Maximum time to wait for HTTP response (1-300 seconds)
                  </p>
                  {errors.timeoutSeconds && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.timeoutSeconds.message}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center space-x-4">
          <button
            type="submit"
            disabled={isSubmitting || createCronJobMutation.isPending}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting || createCronJobMutation.isPending
              ? "Creating..."
              : "Create CRON Job"}
          </button>
          <Link
            href="/dashboard/cron-jobs"
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </Link>
        </div>

        {/* Error Display */}
        {createCronJobMutation.error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <div className="text-sm text-red-700 dark:text-red-400">
              Failed to create CRON job. Please check your inputs and try again.
            </div>
          </div>
        )}
      </form>
    </div>
  );
}