'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ErrorBoundary } from './error-boundary';
import { fadeInVariants, buttonVariants } from '@/lib/animations';

interface DashboardErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

function DashboardErrorFallback({ error, resetError }: DashboardErrorFallbackProps) {
  const router = useRouter();

  return (
    <motion.div 
      className="flex items-center justify-center min-h-96 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
      variants={fadeInVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-md w-full space-y-6 text-center p-6">
        <div>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 mb-4">
            <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Page Error
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            This page encountered an error and couldn't load properly.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <motion.div 
            className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-left"
            variants={fadeInVariants}
          >
            <p className="text-xs font-mono text-red-700 dark:text-red-400">
              {error.message}
            </p>
          </motion.div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <motion.button
            onClick={resetError}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            Retry
          </motion.button>
          
          <motion.button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            Dashboard
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

interface DashboardErrorBoundaryProps {
  children: React.ReactNode;
}

export function DashboardErrorBoundary({ children }: DashboardErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('Dashboard Error Boundary:', error, errorInfo);
    
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: trackDashboardError(error, errorInfo);
    }
  };

  return (
    <ErrorBoundary 
      fallback={DashboardErrorFallback}
      onError={handleError}
    >
      {children}
    </ErrorBoundary>
  );
}