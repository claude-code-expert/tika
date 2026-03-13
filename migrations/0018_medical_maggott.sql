ALTER TABLE "workspaces" ALTER COLUMN "name" SET DEFAULT 'My-Workspace';--> statement-breakpoint
CREATE INDEX "idx_members_workspace_role" ON "members" USING btree ("workspace_id","role");--> statement-breakpoint
CREATE INDEX "idx_tickets_workspace_completed_at" ON "tickets" USING btree ("workspace_id","completed_at");