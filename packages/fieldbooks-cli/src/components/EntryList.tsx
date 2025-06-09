import type { Entry } from 'fieldbooks-lib';
import { Box, Text } from 'ink';
import React from 'react';

/** Maximum content length before truncation */
const MAX_CONTENT_LENGTH = 50;
/** Visible content length when truncated */
const TRUNCATED_CONTENT_LENGTH = 47;

// ink-table has issues with TypeScript, use a simple table for now
const SimpleTable: React.FC<{
  data: Array<{ Time: string; Author: string; Type: string; Content: string }>;
}> = ({ data }) => {
  return (
    <Box flexDirection="column">
      {data.map((row, index) => (
        <Box key={index} gap={2}>
          <Text color="cyan">{row.Time}</Text>
          <Text color="yellow">{row.Author}</Text>
          <Text color="magenta">{row.Type}</Text>
          <Text>{row.Content}</Text>
        </Box>
      ))}
    </Box>
  );
};

interface EntryListProps {
  entries: Entry[];
  loading?: boolean;
  error?: string;
}

export const EntryList: React.FC<EntryListProps> = ({ entries, loading, error }) => {
  if (loading) {
    return (
      <Box paddingX={1}>
        <Text color="yellow">Loading entries...</Text>
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

  if (entries.length === 0) {
    return (
      <Box paddingX={1}>
        <Text dimColor>No entries found.</Text>
      </Box>
    );
  }

  const tableData = entries.map((entry) => ({
    Time: new Date(entry.ts).toLocaleString(),
    Author: entry.authorId,
    Type: entry.type || 'update',
    Content:
      entry.md.length > MAX_CONTENT_LENGTH
        ? `${entry.md.substring(0, TRUNCATED_CONTENT_LENGTH)}...`
        : entry.md,
  }));

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1}>
        <Text bold color="blue">
          📋 Recent Entries ({entries.length} total)
        </Text>
      </Box>
      <SimpleTable data={tableData} />
    </Box>
  );
};
