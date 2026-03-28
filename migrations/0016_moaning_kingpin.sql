CREATE TABLE "in_app_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"workspace_id" integer,
	"type" varchar(30) NOT NULL,
	"title" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"link" text,
	"actor_id" text,
	"ref_type" varchar(20),
	"ref_id" integer,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"workspace_id" integer NOT NULL,
	"type" varchar(30) NOT NULL,
	"in_app_enabled" boolean DEFAULT true NOT NULL,
	"slack_enabled" boolean DEFAULT false NOT NULL,
	"telegram_enabled" boolean DEFAULT false NOT NULL,
	CONSTRAINT "notification_preferences_user_ws_type" UNIQUE("user_id","workspace_id","type")
);
--> statement-breakpoint
ALTER TABLE "in_app_notifications" ADD CONSTRAINT "in_app_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "in_app_notifications" ADD CONSTRAINT "in_app_notifications_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "in_app_notifications" ADD CONSTRAINT "in_app_notifications_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_in_app_notifications_user_read" ON "in_app_notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "idx_in_app_notifications_user_created" ON "in_app_notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_in_app_notifications_workspace" ON "in_app_notifications" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_notification_preferences_user_workspace" ON "notification_preferences" USING btree ("user_id","workspace_id");