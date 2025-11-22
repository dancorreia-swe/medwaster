-- Step 1: Add temporary column
ALTER TABLE "questions" ADD COLUMN "references_new" jsonb;

-- Step 2: Migrate existing data - convert text to JSON array format
-- If references is not null and not empty, wrap it in a JSON array with a single object
UPDATE "questions"
SET "references_new" =
  CASE
    WHEN "references" IS NOT NULL AND "references" != '' THEN
      jsonb_build_array(
        jsonb_build_object(
          'title', "references",
          'type', 'other'
        )
      )
    ELSE NULL
  END;

-- Step 3: Drop old column
ALTER TABLE "questions" DROP COLUMN "references";

-- Step 4: Rename new column to original name
ALTER TABLE "questions" RENAME COLUMN "references_new" TO "references";