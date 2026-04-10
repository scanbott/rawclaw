---
name: add-migration
description: Add a versioned database migration for Rawclaw. Creates migration files and updates the schema safely.
triggers: ["add migration", "database change", "schema change", "add table", "add column", "alter table"]
---

# Add Migration

Never modify the database schema by hand. Always use migrations. This keeps changes versioned, reversible, and deployable.

## When to Use

- Adding a new table
- Adding or removing a column
- Changing a column type
- Adding an index
- Any structural database change

## Process

### Step 1: Check Existing Schema
```bash
sqlite3 [RAWCLAW]/store/rawclaw.db ".schema"
```

Review `src/db.ts` for the current migration list and schema.

### Step 2: Write the Migration

Add to the `runMigrations()` function in `src/db.ts`:

```typescript
// Migration: [description] (add to the migrations array)
{
  version: [next_number],
  description: '[what this migration does]',
  up: `
    ALTER TABLE [table] ADD COLUMN [column] [type] [constraints];
  `,
}
```

For new tables:
```typescript
{
  version: [next_number],
  description: 'Add [table_name] table',
  up: `
    CREATE TABLE IF NOT EXISTS [table_name] (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      [column] [type] NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );
    CREATE INDEX IF NOT EXISTS idx_[table]_[column] ON [table_name]([column]);
  `,
}
```

### Step 3: Run the Migration
```bash
cd [RAWCLAW]
npm run migrate
```

Or if the system is running, it will apply automatically on next restart.

### Step 4: Verify
```bash
sqlite3 [RAWCLAW]/store/rawclaw.db ".schema [table_name]"
```

## Rules

- Never use `DROP TABLE` or `DROP COLUMN` in migrations -- mark columns as deprecated instead
- Always use `CREATE TABLE IF NOT EXISTS`
- Always add indexes for columns you'll query by
- Keep migrations small and focused -- one concern per migration
- Test on a copy of the database before running on production
