CREATE TABLE IF NOT EXISTS "dashboard_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"total_executions" integer DEFAULT 0 NOT NULL,
	"successful_executions" integer DEFAULT 0 NOT NULL,
	"failed_executions" integer DEFAULT 0 NOT NULL,
	"average_response_time" real DEFAULT 0 NOT NULL,
	"total_cron_jobs" integer DEFAULT 0 NOT NULL,
	"active_cron_jobs" integer DEFAULT 0 NOT NULL,
	"most_active_hour" integer,
	"success_rate" real DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cron_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"cron_expression" varchar(100) NOT NULL,
	"timezone" varchar(100) DEFAULT 'UTC' NOT NULL,
	"http_template_id" uuid NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"retry_attempts" integer DEFAULT 3 NOT NULL,
	"timeout_seconds" integer DEFAULT 30 NOT NULL,
	"last_execution" timestamp,
	"next_execution" timestamp,
	"execution_count" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "execution_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cron_job_id" uuid NOT NULL,
	"execution_time" timestamp DEFAULT now() NOT NULL,
	"status" varchar(20) NOT NULL,
	"response_status" integer,
	"response_body" text,
	"response_headers" json,
	"execution_duration" integer NOT NULL,
	"error_message" text,
	"retry_attempt" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "http_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"method" varchar(10) DEFAULT 'GET' NOT NULL,
	"url" text NOT NULL,
	"headers" json DEFAULT '{}'::json,
	"body" text,
	"auth_type" varchar(20) DEFAULT 'none' NOT NULL,
	"auth_config" json,
	"timeout_seconds" integer DEFAULT 30 NOT NULL,
	"follow_redirects" boolean DEFAULT true NOT NULL,
	"validate_ssl" boolean DEFAULT true NOT NULL,
	"expected_status_codes" json DEFAULT '[200]'::json,
	"response_validation" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(100) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"avatar_url" text,
	"bio" text,
	"theme_preference" varchar(20) DEFAULT 'system' NOT NULL,
	"timezone" varchar(100) DEFAULT 'UTC' NOT NULL,
	"date_format" varchar(50) DEFAULT 'MM/dd/yyyy' NOT NULL,
	"time_format" varchar(10) DEFAULT '12h' NOT NULL,
	"language" varchar(10) DEFAULT 'en' NOT NULL,
	"email_notifications" boolean DEFAULT true NOT NULL,
	"push_notifications" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"last_active" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dashboard_analytics" ADD CONSTRAINT "dashboard_analytics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cron_jobs" ADD CONSTRAINT "cron_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cron_jobs" ADD CONSTRAINT "cron_jobs_http_template_id_http_templates_id_fk" FOREIGN KEY ("http_template_id") REFERENCES "public"."http_templates"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "execution_logs" ADD CONSTRAINT "execution_logs_cron_job_id_cron_jobs_id_fk" FOREIGN KEY ("cron_job_id") REFERENCES "public"."cron_jobs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "http_templates" ADD CONSTRAINT "http_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
