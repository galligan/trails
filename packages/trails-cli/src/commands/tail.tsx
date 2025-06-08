import React, { useEffect, useState } from 'react';
import { render } from 'ink';
import { resolve } from 'path';
import {
  setupDatabase,
  listNotes,
  validateListOptions,
  type Note,
} from 'trails-lib';
import { NoteList } from '../components/NoteList.js';

interface TailCommandProps {
  limit?: number;
  agentId?: string;
  after?: number;
  before?: number;
}

const TailCommand: React.FC<TailCommandProps> = ({ limit, agentId, after, before }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotes = async (): Promise<void> => {
      try {
        const listOptions = validateListOptions({
          limit,
          agentId,
          after,
          before,
        });

        const dbPath = resolve('./trails.sqlite');
        const db = await setupDatabase(dbPath);
        const fetchedNotes = await listNotes(db, listOptions);

        setNotes(fetchedNotes);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      }
    };

    void fetchNotes();
  }, [limit, agentId, after, before]);

  return <NoteList notes={notes} loading={loading} error={error || undefined} />;
};

export function runTailCommand(options: TailCommandProps): void {
  const { waitUntilExit } = render(<TailCommand {...options} />);
  waitUntilExit().then(() => process.exit(0));
}