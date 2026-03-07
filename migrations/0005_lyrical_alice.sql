CREATE TABLE "sprints" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspace_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"goal" text,
	"status" varchar(20) DEFAULT 'PLANNED' NOT NULL,
	"start_date" date,
	"end_date" date,
	"story_points_total" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_assignees" (
	"ticket_id" integer NOT NULL,
	"member_id" integer NOT NULL,
	CONSTRAINT "ticket_assignees_ticket_id_member_id_pk" PRIMARY KEY("ticket_id","member_id")
);
--> statement-breakpoint
CREATE TABLE "workspace_invites" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspace_id" integer NOT NULL,
	"invited_by" integer NOT NULL,
	"token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(10) NOT NULL,
	"status" varchar(10) DEFAULT 'PENDING' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
-- Migrate existing role values to new RBAC system
UPDATE "members" SET "role" = 'OWNER' WHERE "role" = 'admin';
UPDATE "members" SET "role" = 'MEMBER' WHERE "role" = 'member';
--> statement-breakpoint
ALTER TABLE "members" ALTER COLUMN "role" SET DEFAULT 'MEMBER';--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "invited_by" integer;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "joined_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "sprint_id" integer;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "story_points" integer;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "type" varchar(10) DEFAULT 'PERSONAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_assignees" ADD CONSTRAINT "ticket_assignees_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_assignees" ADD CONSTRAINT "ticket_assignees_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invites" ADD CONSTRAINT "workspace_invites_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invites" ADD CONSTRAINT "workspace_invites_invited_by_members_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_sprints_workspace_status" ON "sprints" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "idx_ticket_assignees_member_id" ON "ticket_assignees" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_workspace_invites_workspace_status" ON "workspace_invites" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "idx_workspace_invites_token" ON "workspace_invites" USING btree ("token");--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_sprint_id_sprints_id_fk" FOREIGN KEY ("sprint_id") REFERENCES "public"."sprints"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_tickets_sprint_id" ON "tickets" USING btree ("sprint_id");