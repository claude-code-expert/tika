CREATE TABLE "notification_signups" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"send" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_signups_email_type_unique" UNIQUE("email","type")
);
--> statement-breakpoint
CREATE INDEX "idx_notification_signups_type_send" ON "notification_signups" USING btree ("type","send");