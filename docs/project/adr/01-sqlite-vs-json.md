# SQLite vs JSON for Logbooks

## Current Choice: SQLite

Logbooks currently uses SQLite for storage. Here's why this makes sense and when JSON might be better.

## Benefits of SQLite

### 1. **Efficient Querying**
```sql
-- Fast queries with indexes
SELECT * FROM entries 
WHERE author_id = 'mg' 
  AND created_at > datetime('now', '-7 days')
  AND type = 'error'
ORDER BY created_at DESC
LIMIT 10;
```
- Indexed searches are O(log n) vs O(n) for JSON
- Complex queries (date ranges, multiple filters) are trivial
- Aggregations are built-in (COUNT, AVG, GROUP BY)

### 2. **Append Performance**
- SQLite handles concurrent writes well
- No need to read/parse/rewrite entire file
- Write performance stays constant as data grows
- JSON requires reading entire file + appending + writing entire file

### 3. **Data Integrity**
```typescript
// SQLite enforces constraints
FOREIGN KEY (author_id) REFERENCES authors(id)
CHECK (type IN ('update', 'decision', 'error', ...))
```
- Type constraints at database level
- Foreign key relationships
- ACID transactions
- No risk of corrupted JSON from partial writes

### 4. **Scalability**
- 10 entries: Both work fine
- 10,000 entries: SQLite still instant, JSON gets slow
- 1,000,000 entries: SQLite works, JSON unusable
- Can add indexes as needed without restructuring

### 5. **Concurrent Access**
- Multiple processes can read simultaneously
- Write locks are fine-grained
- Built-in corruption prevention
- JSON requires custom locking mechanism

### 6. **Rich Querying**
```sql
-- Complex analytics
SELECT 
  author_id,
  type,
  COUNT(*) as count,
  DATE(created_at) as day
FROM entries
GROUP BY author_id, type, day
HAVING count > 5;
```

### 7. **Partial Data Access**
- Read last 10 entries without loading entire database
- Search specific date range efficiently
- JSON requires parsing entire file even for one entry

## Benefits of JSON

### 1. **Human Readable**
```json
{
  "entries": [
    {
      "id": "123",
      "author": "mg",
      "content": "Deploy successful",
      "type": "update",
      "timestamp": "2024-01-09T10:30:00Z"
    }
  ]
}
```
- Can read/edit with any text editor
- Easy to version control (see diffs)
- No special tools needed

### 2. **Portability**
- Just a text file
- No binary format concerns
- Works everywhere without dependencies
- Easy to email, share, backup

### 3. **Simplicity**
```typescript
// Simple to implement
const data = JSON.parse(fs.readFileSync('logbook.json'));
data.entries.push(newEntry);
fs.writeFileSync('logbook.json', JSON.stringify(data, null, 2));
```

### 4. **Git-Friendly**
- See diffs of what changed
- Merge conflicts are readable
- Can review in PRs
- History is understandable

### 5. **No Schema Migrations**
- Just add new fields
- Old entries work fine
- No migration scripts needed

## When JSON Makes Sense

### Good for JSON:
- **Config files** (exactly what we're planning!)
- **Export format** for sharing
- **Small datasets** (<1000 entries)
- **Read-mostly** data
- **Need version control** of the data itself

### Example: Config files
```json
// Perfect for JSON
{
  "author": {
    "defaultId": "mg",
    "defaultName": "Matt Galligan"
  },
  "cli": {
    "richOutput": true
  }
}
```

## When SQLite Makes Sense

### Good for SQLite:
- **Append-heavy** operations (logs, events)
- **Large datasets** (>1000 entries)
- **Complex queries** needed
- **Multiple concurrent users**
- **Performance matters**

### Example: Logbook entries
- Constantly appending new entries
- Need to query by date, author, type
- Want fast "last 10 entries"
- May grow to thousands of entries

## Hybrid Approach (Current Plan)

The best of both worlds:

### SQLite for:
- **Logbook entries** (`.logbook/logbook.sqlite`)
- **High-performance queries**
- **Data integrity**

### JSON for:
- **Configuration** (`.logbook/config.json`)
- **Exports** (`logbooks export --format=json`)
- **Backups** (human-readable snapshots)
- **Templates** (shareable logbook templates)

## Performance Comparison

| Operation | 100 entries | 10,000 entries | 1,000,000 entries |
|-----------|-------------|----------------|-------------------|
| **Add entry (SQLite)** | <1ms | <1ms | <1ms |
| **Add entry (JSON)** | ~5ms | ~200ms | ~20s |
| **List last 10 (SQLite)** | <1ms | <1ms | <1ms |
| **List last 10 (JSON)** | ~2ms | ~80ms | ~8s |
| **Search by author (SQLite)** | <1ms | <5ms | <50ms* |
| **Search by author (JSON)** | ~3ms | ~100ms | ~10s |

*With index

## Code Example: Why SQLite Scales

```typescript
// SQLite: Efficient pagination
async function listEntries(page: number = 1, limit: number = 10) {
  return db.select()
    .from(entries)
    .orderBy(desc(entries.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);
}

// JSON: Must load everything
function listEntriesJSON(page: number = 1, limit: number = 10) {
  const data = JSON.parse(fs.readFileSync('logbook.json'));
  const sorted = data.entries.sort((a, b) => b.timestamp - a.timestamp);
  return sorted.slice((page - 1) * limit, page * limit);
}
```

## Summary

**SQLite is the right choice for Logbooks because:**
1. It's an append-heavy log system
2. Users will accumulate thousands of entries
3. We need efficient querying (by date, author, type)
4. Performance should stay constant as data grows
5. Concurrent access is important (multiple tools/agents)

**JSON is perfect for:**
1. Configuration files (as planned)
2. Export/import functionality
3. Sharing logbook snapshots
4. Templates and examples

The hybrid approach gives us the best of both worlds: SQLite's performance and reliability for data, JSON's readability and simplicity for configuration.