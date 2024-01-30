-- CreateTable
CREATE TABLE "todo_lists" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "todo_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "todos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "title" TEXT NOT NULL,
    "done" TIMESTAMP(3),
    "group_id" UUID NOT NULL,

    CONSTRAINT "todos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "todos" ADD CONSTRAINT "todos_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "todo_lists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create UpdateAt Trigger (todo)
CREATE TRIGGER update_todo_updated_at BEFORE
UPDATE ON "todos" FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create UpdateAt Trigger (todo_list)
CREATE TRIGGER update_todo_list_updated_at BEFORE
UPDATE ON "todo_lists" FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
