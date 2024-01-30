-- Drop the existing foreign key constraints
ALTER TABLE todos DROP CONSTRAINT todos_group_id_fkey;
ALTER TABLE group_members DROP CONSTRAINT group_members_group_id_fkey;
ALTER TABLE todo_lists DROP CONSTRAINT todo_lists_owner_id_fkey;

-- Rename the table
ALTER TABLE todo_lists RENAME TO groups;

-- Rename the primary key
ALTER TABLE groups RENAME CONSTRAINT todo_lists_pkey TO groups_pkey;

-- Add the foreign key constraints back with the new table name
ALTER TABLE todos
    ADD CONSTRAINT todos_group_id_fkey
    FOREIGN KEY (group_id)
    REFERENCES groups
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE group_members
    ADD CONSTRAINT group_members_group_id_fkey
    FOREIGN KEY (group_id)
    REFERENCES groups
    ON UPDATE CASCADE ON DELETE RESTRICT;

-- Add the owner_id foreign key constraint back with the new table name
ALTER TABLE groups
    ADD CONSTRAINT groups_owner_id_fkey
    FOREIGN KEY (owner_id)
    REFERENCES users
    ON UPDATE CASCADE ON DELETE RESTRICT;