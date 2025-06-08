# Database Migrations

This directory contains database migrations for the Trails database.

## Usage

### Generate a new migration

After making changes to the schema in `src/schema.ts`, generate a new migration:

```bash
pnpm db:generate
```

### Apply migrations

To apply all pending migrations to your database:

```bash
pnpm db:migrate
```

Or use the custom migration script:

```bash
pnpm migrate [path/to/database.sqlite]
```

### Push schema changes (development)

For development, you can push schema changes directly without creating migrations:

```bash
pnpm db:push
```

### View database

To open Drizzle Studio and view your database:

```bash
pnpm db:studio
```

## Migration Strategy

1. All schema changes should be made in `src/schema.ts`
2. Generate migrations using `pnpm db:generate`
3. Review the generated SQL in the `drizzle` folder
4. Apply migrations using `pnpm db:migrate`

## Indexes

The schema includes the following indexes for performance:

- `users_created_at_idx` - For sorting users by creation date
- `agents_user_id_idx` - For finding agents by user
- `agents_created_at_idx` - For sorting agents by creation date
- `agents_label_idx` - For searching agents by label
- `notes_agent_id_idx` - For finding notes by agent
- `notes_ts_idx` - For sorting notes by timestamp
- `notes_agent_id_ts_idx` - Composite index for efficient querying by agent and timestamp