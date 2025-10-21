ALTER TABLE "deposit_requests" ADD COLUMN "transaction_id" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "deposit_requests" ADD COLUMN "bank_name" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "deposit_requests" ADD COLUMN "bank_method" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "deposit_requests" DROP COLUMN "image_url";