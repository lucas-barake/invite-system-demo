-- CreateTable
CREATE TABLE "users" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid (),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "name" TEXT,
  "email" TEXT NOT NULL,
  "imageUrl" TEXT,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users" ("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users" ("email");

-- Create UpdateAt Function
CREATE
OR REPLACE FUNCTION update_updated_at_column () RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- CreateTrigger
CREATE TRIGGER update_user_updated_at BEFORE
UPDATE ON "users" FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column ();
