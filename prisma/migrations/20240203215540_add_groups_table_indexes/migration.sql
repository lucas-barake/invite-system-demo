-- CreateIndex
CREATE INDEX "groups_owner_id_idx" ON "groups"("owner_id");

-- CreateIndex
CREATE INDEX "groups_deleted_at_idx" ON "groups"("deleted_at") WHERE "deleted_at" IS NULL;