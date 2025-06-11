import { initializeDatabase, listEntries, validateListOptions, type Entry } from 'logbooks-lib';
import { render } from 'ink';
import React, { useEffect, useState } from 'react';

import { EntryList } from '../components/EntryList.js';

interface ListCommandProps {
  limit?: number;
  authorId?: string;
  after?: number;
  before?: number;
  type?: string;
  sort?: string;
  order?: string;
}

const ListCommand: React.FC<ListCommandProps> = ({
  limit,
  authorId,
  after,
  before,
  type,
  sort,
  order,
}) => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEntries = async (): Promise<void> => {
      try {
        const listOptions = validateListOptions({
          limit,
          authorId,
          after,
          before,
          type,
        });

        const db = await initializeDatabase();
        let fetchedEntries = await listEntries(db, listOptions);

        // Apply sorting if requested
        if (sort) {
          fetchedEntries = [...fetchedEntries].sort((a, b) => {
            let compareValue = 0;

            switch (sort) {
              case 'timestamp':
                compareValue = a.ts - b.ts;
                break;
              case 'author':
                compareValue = a.authorId.localeCompare(b.authorId);
                break;
              case 'type':
                compareValue = (a.type || '').localeCompare(b.type || '');
                break;
              default:
                compareValue = a.ts - b.ts;
            }

            return order === 'asc' ? compareValue : -compareValue;
          });
        }

        setEntries(fetchedEntries);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      }
    };

    void fetchEntries();
  }, [limit, authorId, after, before, type, sort, order]);

  return <EntryList entries={entries} loading={loading} error={error || undefined} />;
};

export function runListCommand(options: ListCommandProps): void {
  const { waitUntilExit } = render(<ListCommand {...options} />);
  waitUntilExit().then(() => process.exit(0));
}
