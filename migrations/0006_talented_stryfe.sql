CREATE TABLE "workspace_join_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspace_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"message" text,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"reviewed_by" integer,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "join_requests_workspace_user_unique" UNIQUE("workspace_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "user_type" varchar(20);--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "is_searchable" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "workspace_join_requests" ADD CONSTRAINT "workspace_join_requests_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_join_requests" ADD CONSTRAINT "workspace_join_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_join_requests" ADD CONSTRAINT "workspace_join_requests_reviewed_by_members_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_join_requests_workspace_status" ON "workspace_join_requests" USING btree ("workspace_id","status");