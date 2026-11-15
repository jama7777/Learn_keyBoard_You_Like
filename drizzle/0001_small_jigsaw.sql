CREATE TABLE "interaction_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text,
	"score" integer NOT NULL,
	"classification" text NOT NULL,
	"ua_bot" integer DEFAULT 0 NOT NULL,
	"event_count" integer DEFAULT 0 NOT NULL,
	"key_count" integer DEFAULT 0 NOT NULL,
	"mouse_moves" integer DEFAULT 0 NOT NULL,
	"scrolls" integer DEFAULT 0 NOT NULL,
	"span_ms" integer DEFAULT 0 NOT NULL,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "interaction_sessions" ADD CONSTRAINT "interaction_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "interaction_sessions_created_idx" ON "interaction_sessions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "interaction_sessions_session_idx" ON "interaction_sessions" USING btree ("session_id");