import { eq } from 'drizzle-orm';
import {
  users,
  agents,
  retryDb,
  type TrailsDb,
} from 'trails-lib';

/**
 * Ensures that an agent exists in the database, creating it if necessary.
 * Also creates a default user if needed.
 * 
 * @param db - The database connection
 * @param agentId - The agent ID to ensure exists
 * @throws {TrailsDbError} If database operations fail after retries
 */
export async function ensureAgentExists(db: TrailsDb, agentId: string): Promise<void> {
  return retryDb(
    async () => {
      // Check if agent exists
      const existingAgent = await db.select().from(agents).where(eq(agents.id, agentId)).limit(1);

      if (existingAgent.length === 0) {
        // Create default user if doesn't exist
        const defaultUserId = 'cli-user';
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.id, defaultUserId))
          .limit(1);

        if (existingUser.length === 0) {
          await db.insert(users).values({
            id: defaultUserId,
            name: 'CLI User',
            createdAt: Date.now(),
          });
        }

        // Create agent
        await db.insert(agents).values({
          id: agentId,
          userId: defaultUserId,
          label: agentId,
          createdAt: Date.now(),
        });
      }
    },
    {
      onRetry: (error, attempt) => {
        console.warn(`Failed to ensure agent exists (attempt ${attempt}):`, error);
      },
    },
  );
}