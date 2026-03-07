-- Migration: Merge issues table into tickets (parentId self-reference)
-- Step 1: Add parent_id column to tickets
ALTER TABLE "tickets" ADD COLUMN "parent_id" integer;
--> statement-breakpoint

-- Step 2: Migrate issues → tickets (GOAL/STORY/FEATURE become ticket rows)
-- We insert them preserving created_at, using a temp mapping approach
DO $$
DECLARE
  issue_row RECORD;
  new_ticket_id INTEGER;
BEGIN
  -- Insert each issue as a ticket (GOAL/STORY/FEATURE)
  -- We track old issue id → new ticket id via a temp table
  CREATE TEMP TABLE issue_id_map (old_id INTEGER, new_id INTEGER);

  FOR issue_row IN SELECT * FROM issues ORDER BY id LOOP
    INSERT INTO tickets (workspace_id, title, type, status, priority, position, deleted, created_at, updated_at)
    VALUES (issue_row.workspace_id, issue_row.name, issue_row.type, 'BACKLOG', 'MEDIUM', 0, false, issue_row.created_at, issue_row.created_at)
    RETURNING id INTO new_ticket_id;

    INSERT INTO issue_id_map VALUES (issue_row.id, new_ticket_id);
  END LOOP;

  -- Step 3: Restore issue hierarchy — issues.parent_id → new ticket parent_id
  UPDATE tickets t
  SET parent_id = (
    SELECT m2.new_id FROM issues i
    JOIN issue_id_map m1 ON m1.new_id = t.id
    JOIN issue_id_map m2 ON m2.old_id = i.parent_id
    WHERE i.id = m1.old_id AND i.parent_id IS NOT NULL
  )
  WHERE EXISTS (
    SELECT 1 FROM issue_id_map m1
    JOIN issues i ON i.id = m1.old_id AND i.parent_id IS NOT NULL
    WHERE m1.new_id = t.id
  );

  -- Step 4: Update old tickets.issue_id → parent_id (link to newly inserted ticket rows)
  UPDATE tickets t
  SET parent_id = (
    SELECT m.new_id FROM issue_id_map m WHERE m.old_id = t.issue_id
  )
  WHERE t.issue_id IS NOT NULL;

  DROP TABLE issue_id_map;
END $$;
--> statement-breakpoint

-- Step 5: Drop old issue_id column
ALTER TABLE "tickets" DROP COLUMN "issue_id";
--> statement-breakpoint

-- Step 6: Drop issues table (indexes drop automatically)
DROP INDEX IF EXISTS "idx_issues_workspace_type";
--> statement-breakpoint
DROP INDEX IF EXISTS "idx_issues_parent_id";
--> statement-breakpoint
DROP TABLE "issues";
--> statement-breakpoint

-- Step 7: Create index on parent_id
CREATE INDEX "idx_tickets_parent_id" ON "tickets" USING btree ("parent_id");
