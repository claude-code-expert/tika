CREATE INDEX "idx_comments_member_id" ON "comments" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_tickets_assignee_id" ON "tickets" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX "idx_tickets_issue_id" ON "tickets" USING btree ("issue_id");