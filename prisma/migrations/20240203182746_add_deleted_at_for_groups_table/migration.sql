-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "deleted_at" TIMESTAMPTZ;

-- CreateIndex
CREATE INDEX "group_invites_expiration_time_idx" ON "group_invites"("expiration_time");
