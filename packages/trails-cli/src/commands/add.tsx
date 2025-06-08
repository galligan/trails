import React, { useState } from 'react';
import { render, Text } from 'ink';
import { resolve } from 'path';
import {
  setupDatabase,
  addNote,
  validateNoteInput,
} from 'trails-lib';
import { NoteEditor } from '../components/NoteEditor.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { ErrorMessage } from '../components/ErrorMessage.js';
import { ensureAgentExists } from '../utils/agent.js';

interface AddCommandProps {
  agentId: string;
  timestamp?: number;
  initialContent?: string;
}

const AddCommand: React.FC<AddCommandProps> = ({ agentId, timestamp, initialContent }) => {
  const [status, setStatus] = useState<'editing' | 'saving' | 'success' | 'error'>(
    initialContent ? 'saving' : 'editing'
  );
  const [error, setError] = useState<Error | null>(null);
  const [noteId, setNoteId] = useState<string | null>(null);

  // If initial content is provided, submit it immediately
  React.useEffect(() => {
    if (initialContent && status === 'saving') {
      void handleSubmit(initialContent);
    }
  }, []);

  const handleSubmit = async (content: string): Promise<void> => {
    setStatus('saving');

    try {
      const input = validateNoteInput({
        agentId,
        md: content,
        ts: timestamp,
      });

      const dbPath = resolve('./trails.sqlite');
      const db = await setupDatabase(dbPath);

      // Ensure agent exists
      await ensureAgentExists(db, input.agentId);

      const id = await addNote(db, input);
      setNoteId(id);
      setStatus('success');

      // Exit after a short delay to show success message
      setTimeout(() => {
        process.exit(0);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setStatus('error');
    }
  };

  const handleCancel = (): void => {
    process.exit(0);
  };

  if (status === 'saving') {
    return <LoadingSpinner message="Saving note..." />;
  }

  if (status === 'error' && error) {
    return (
      <ErrorMessage
        error={error}
        suggestion="Check your database connection and try again"
      />
    );
  }

  if (status === 'success' && noteId) {
    return (
      <React.Fragment>
        <Text color="green">✅ Note saved successfully!</Text>
        <Text dimColor> ID: {noteId}</Text>
      </React.Fragment>
    );
  }

  return (
    <NoteEditor
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      initialContent={initialContent}
    />
  );
};

export function runAddCommand(options: AddCommandProps): void {
  render(<AddCommand {...options} />);
}