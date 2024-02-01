-- CreateTable
CREATE TABLE "group_invites" (
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitee_email" TEXT NOT NULL,
    "expiration_time" TIMESTAMPTZ NOT NULL,
    "group_id" UUID NOT NULL,

    CONSTRAINT "group_invites_pkey" PRIMARY KEY ("invitee_email","group_id")
);

-- CreateIndex
CREATE INDEX "group_invites_invitee_email_idx" ON "group_invites"("invitee_email");

-- CreateIndex
CREATE INDEX "group_invites_group_id_idx" ON "group_invites"("group_id");

-- AddForeignKey
ALTER TABLE "group_invites" ADD CONSTRAINT "group_invites_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
