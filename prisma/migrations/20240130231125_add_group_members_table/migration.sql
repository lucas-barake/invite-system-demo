/*
  Warnings:

  - Added the required column `owner_id` to the `todo_lists` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "todo_lists" ADD COLUMN     "owner_id" UUID NOT NULL;

-- CreateTable
CREATE TABLE "group_members" (
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "user_id" UUID NOT NULL,
    "group_id" UUID NOT NULL,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("user_id","group_id")
);

-- AddForeignKey
ALTER TABLE "todo_lists" ADD CONSTRAINT "todo_lists_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "todo_lists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create UpdateAt Trigger
CREATE TRIGGER update_group_members_updated_at BEFORE
UPDATE ON "group_members" FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();