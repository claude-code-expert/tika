CREATE TABLE "notification_channels" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspace_id" integer NOT NULL,
	"type" varchar(20) NOT NULL,
	"config" text DEFAULT '{}' NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_channels_workspace_type_unique" UNIQUE("workspace_id","type")
);
--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "role" varchar(10) DEFAULT 'member' NOT NULL;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "notification_channels" ADD CONSTRAINT "notification_channels_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;