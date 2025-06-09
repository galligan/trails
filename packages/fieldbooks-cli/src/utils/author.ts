import { eq } from 'drizzle-orm';
import { authors, retryDb, type FieldbooksDb } from 'fieldbooks-lib';

/**
 * Ensures that an author exists in the database, creating it if necessary.
 *
 * @param db - The database connection
 * @param authorId - The author ID to ensure exists
 * @param authorType - The type of author (user, agent, or service)
 * @throws {FieldbooksDbError} If database operations fail after retries
 */
export async function ensureAuthorExists(
  db: FieldbooksDb,
  authorId: string,
  authorType: 'user' | 'agent' | 'service' = 'agent',
): Promise<void> {
  return retryDb(
    async () => {
      // Check if author exists
      const existingAuthor = await db
        .select()
        .from(authors)
        .where(eq(authors.id, authorId))
        .limit(1);

      if (existingAuthor.length === 0) {
        // Create author
        await db.insert(authors).values({
          id: authorId,
          type: authorType,
          name: authorId,
          createdAt: Date.now(),
        });
      }
    },
    {
      onRetry: (error, attempt) => {
        console.warn(`Failed to ensure author exists (attempt ${attempt}):`, error);
      },
    },
  );
}
