"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { AnimatedPage } from "@/components/ui/animated-page";
import { formVariants, fieldVariants, buttonVariants } from "@/lib/animations";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (
    data: LoginFormData,
    e?: React.BaseSyntheticEvent,
  ) => {
    console.log("🚀 Login form submitted", {
      email: data.email,
      hasPassword: !!data.password,
    });

    // Prevent default form submission
    if (e) {
      e.preventDefault();
    }

    setIsLoading(true);
    setError(null);

    // Show loading toast
    const loadingToast = toast.loading("Signing in...");

    try {
      console.log("📡 Attempting login API call...");
      const response = await apiClient.login(data.email, data.password);
      console.log("✅ Login API response:", {
        success: response?.success,
        hasUser: !!response?.user,
        hasTokens: !!response?.tokens,
      });

      if (response.success && response.user && response.tokens) {
        const { user, tokens } = response;
        console.log("👤 User data received:", {
          userId: user.id,
          email: user.email,
          username: user.username,
        });
        console.log("🔑 Tokens received:", {
          hasAccessToken: !!tokens.accessToken,
          hasRefreshToken: !!tokens.refreshToken,
          expiresIn: tokens.expiresIn,
        });

        login(user, tokens.accessToken, tokens.refreshToken);

        // Show success toast and redirect
        toast.success(`Welcome back, ${user.firstName || user.username}!`, {
          id: loadingToast,
          description: "You have been successfully logged in.",
        });

        console.log("🔄 Redirecting to dashboard...");
        router.push("/dashboard");
      } else {
        console.warn("⚠️ Login response missing success or data:", response);
        toast.error("Login failed", {
          id: loadingToast,
          description: "Invalid response from server.",
        });
      }
    } catch (err: any) {
      console.error("❌ Login error:", {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        fullError: err,
      });

      let errorMessage = "Please try again.";
      let errorTitle = "Login failed";

      if (err.response?.status === 401) {
        errorTitle = "Invalid credentials";
        errorMessage = "Please check your email and password.";
      } else if (err.response?.status === 429) {
        errorTitle = "Too many attempts";
        errorMessage = "Please try again later.";
      } else if (err.response?.status === 500) {
        errorTitle = "Server error";
        errorMessage = "Please try again later.";
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (!navigator.onLine) {
        errorTitle = "No internet connection";
        errorMessage = "Please check your network.";
      }

      toast.error(errorTitle, {
        id: loadingToast,
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
      console.log("🏁 Login attempt finished");
    }
  };

  return (
    <AnimatedPage className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="max-w-md w-full space-y-8"
        variants={formVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fieldVariants}>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Sign in to CronX
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            HTTP Automation Platform with CRON Scheduling
          </p>
        </motion.div>

        <motion.form
          className="mt-8 space-y-6"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          variants={fieldVariants}
        >
          <motion.div
            className="rounded-md shadow-sm -space-y-px"
            variants={fieldVariants}
          >
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                {...register("email")}
                type="email"
                autoComplete="email"
                disabled={isLoading}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Email address"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const passwordField = document.querySelector(
                      'input[name="password"]',
                    ) as HTMLInputElement;
                    if (passwordField) {
                      passwordField.focus();
                    }
                  }
                }}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                {...register("password")}
                type="password"
                autoComplete="current-password"
                disabled={isLoading}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Password"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    console.log("⌨️ Enter key pressed in password field");
                    e.preventDefault();
                    handleSubmit(onSubmit)();
                  }
                }}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>
          </motion.div>

          <motion.div variants={fieldVariants}>
            <motion.button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={(e) => {
                console.log("🖱️ Submit button clicked");
                // Form will handle submission through onSubmit
              }}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </motion.button>
          </motion.div>

          <motion.div
            className="flex items-center justify-between"
            variants={fieldVariants}
          >
            <div className="text-sm">
              <Link
                href="/auth/forgot-password"
                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Forgot your password?
              </Link>
            </div>
            <div className="text-sm">
              <Link
                href="/auth/register"
                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Create an account
              </Link>
            </div>
          </motion.div>
        </motion.form>
      </motion.div>
    </AnimatedPage>
  );
}
