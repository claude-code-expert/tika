ALTER TABLE "tickets" ADD COLUMN "deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_tickets_workspace_deleted" ON "tickets" USING btree ("workspace_id","deleted");