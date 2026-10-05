CREATE TYPE "public"."trade_side" AS ENUM('buy', 'sell');--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "side" "trade_side" DEFAULT 'buy' NOT NULL;