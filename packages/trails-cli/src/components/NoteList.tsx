import React from 'react';
import { Box, Text } from 'ink';
import type { Note } from 'trails-lib';

/** Maximum content length before truncation */
const MAX_CONTENT_LENGTH = 50;
/** Visible content length when truncated */
const TRUNCATED_CONTENT_LENGTH = 47;

// ink-table has issues with TypeScript, use a simple table for now
const SimpleTable: React.FC<{ data: Array<{ Time: string; Agent: string; Content: string }> }> = ({ data }) => {
  return (
    <Box flexDirection="column">
      {data.map((row, index) => (
        <Box key={index} gap={2}>
          <Text color="cyan">{row.Time}</Text>
          <Text color="yellow">{row.Agent}</Text>
          <Text>{row.Content}</Text>
        </Box>
      ))}
    </Box>
  );
};

interface NoteListProps {
  notes: Note[];
  loading?: boolean;
  error?: string;
}

export const NoteList: React.FC<NoteListProps> = ({ notes, loading, error }) => {
  if (loading) {
    return (
      <Box paddingX={1}>
        <Text color="yellow">Loading notes...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box paddingX={1}>
        <Text color="red">❌ Error: {error}</Text>
      </Box>
    );
  }

  if (notes.length === 0) {
    return (
      <Box paddingX={1}>
        <Text dimColor>No notes found.</Text>
      </Box>
    );
  }

  const tableData = notes.map((note) => ({
    Time: new Date(note.ts).toLocaleString(),
    Agent: note.agentId,
    Content: note.md.length > MAX_CONTENT_LENGTH ? note.md.substring(0, TRUNCATED_CONTENT_LENGTH) + '...' : note.md,
  }));

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1}>
        <Text bold color="blue">
          📋 Recent Notes ({notes.length} total)
        </Text>
      </Box>
      <SimpleTable data={tableData} />
    </Box>
  );
};