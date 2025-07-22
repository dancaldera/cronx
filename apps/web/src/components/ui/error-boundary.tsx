'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { fadeInVariants, buttonVariants } from '@/lib/animations';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <motion.div 
      className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8"
      variants={fadeInVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 mb-4">
            <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Something went wrong
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            We've encountered an unexpected error. Don't worry, our team has been notified.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <motion.div 
            className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-left"
            variants={fadeInVariants}
          >
            <h3 className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">
              Error Details (Development Only)
            </h3>
            <pre className="text-xs text-red-700 dark:text-red-400 whitespace-pre-wrap overflow-auto max-h-32">
              {error.message}
            </pre>
          </motion.div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.button
            onClick={resetError}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            Try again
          </motion.button>
          
          <motion.button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            Go home
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call the optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you would send this to your error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: trackError(error, errorInfo);
      console.error('Production Error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      });
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent 
          error={this.state.error} 
          resetError={this.resetError} 
        />
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to trigger error boundaries
export function useErrorHandler() {
  return (error: Error) => {
    // This will trigger the nearest error boundary
    throw error;
  };
}

// Async error boundary wrapper for handling promise rejections
export function withAsyncErrorBoundary<T extends object>(
  WrappedComponent: React.ComponentType<T>
) {
  return function AsyncErrorBoundaryWrapper(props: T) {
    const handleError = useErrorHandler();

    React.useEffect(() => {
      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        console.error('Unhandled promise rejection:', event.reason);
        handleError(new Error(event.reason));
      };

      window.addEventListener('unhandledrejection', handleUnhandledRejection);

      return () => {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    }, [handleError]);

    return <WrappedComponent {...props} />;
  };
}