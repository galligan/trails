import { initializeDatabase, addEntry, validateEntryInput, type EntryType } from 'fieldbooks-lib';
import { render, Text } from 'ink';
import React, { useState, useCallback } from 'react';

import { EntryEditor } from '../components/EntryEditor.js';
import { ErrorMessage } from '../components/ErrorMessage.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { ensureAuthorExists } from '../utils/author.js';

/** Timeout for database operations in milliseconds */
const OPERATION_TIMEOUT = 30000; // 30 seconds

/** Delay before exit to show success message */
const SUCCESS_DISPLAY_DELAY = 1000; // 1 second

interface AddCommandProps {
  authorId: string;
  timestamp?: number;
  type?: EntryType;
  initialContent?: string;
}

const AddCommand: React.FC<AddCommandProps> = ({ authorId, timestamp, type, initialContent }) => {
  const [status, setStatus] = useState<'editing' | 'saving' | 'success' | 'error'>(
    initialContent !== undefined && initialContent !== '' ? 'saving' : 'editing',
  );
  const [error, setError] = useState<Error | null>(null);
  const [entryId, setEntryId] = useState<string | null>(null);

  // If initial content is provided, submit it immediately
  React.useEffect(() => {
    if (initialContent !== undefined && initialContent !== '' && status === 'saving') {
      void handleSubmit(initialContent);
    }
  }, [initialContent, status, handleSubmit]);

  const handleSubmit = useCallback(
    async (content: string): Promise<void> => {
      setStatus('saving');

      try {
        const input = validateEntryInput({
          authorId,
          md: content,
          ts: timestamp,
          type,
        });

        // Create a timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Operation timed out')), OPERATION_TIMEOUT);
        });

        // Race the operation against the timeout
        await Promise.race([
          (async (): Promise<void> => {
            const db = await initializeDatabase();

            // Ensure author exists
            await ensureAuthorExists(db, input.authorId);

            const id = await addEntry(db, input);
            setEntryId(id);
            setStatus('success');
          })(),
          timeoutPromise,
        ]);

        // Exit after a short delay to show success message
        setTimeout(() => {
          process.exit(0);
        }, SUCCESS_DISPLAY_DELAY);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus('error');
      }
    },
    [authorId, timestamp, type],
  );

  const handleCancel = (): void => {
    process.exit(0);
  };

  if (status === 'saving') {
    return <LoadingSpinner message="Saving entry..." />;
  }

  if (status === 'error' && error) {
    return <ErrorMessage error={error} suggestion="Check your database connection and try again" />;
  }

  if (status === 'success' && entryId !== null) {
    return (
      <React.Fragment>
        <Text color="green">✅ Entry saved successfully!</Text>
        <Text dimColor> ID: {entryId}</Text>
        {type !== undefined && <Text dimColor> Type: {type}</Text>}
      </React.Fragment>
    );
  }

  return (
    <EntryEditor
      onSubmit={(content) => void handleSubmit(content)}
      onCancel={handleCancel}
      initialContent={initialContent}
    />
  );
};

export function runAddCommand(options: AddCommandProps): void {
  render(<AddCommand {...options} />);
}
