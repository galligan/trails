import { Box, Text, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import React, { useState } from 'react';

interface EntryEditorProps {
  onSubmit: (content: string) => void;
  onCancel: () => void;
  initialContent?: string;
}

export const EntryEditor: React.FC<EntryEditorProps> = ({ onSubmit, onCancel, initialContent }) => {
  const [content, setContent] = useState(initialContent || '');
  const { exit } = useApp();

  useInput((input, key) => {
    if (key.ctrl && input === 's') {
      if (content.trim()) {
        onSubmit(content);
      }
    } else if (key.escape) {
      onCancel();
      exit();
    }
  });

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1}>
        <Text bold color="green">
          📝 Create a new entry
        </Text>
      </Box>
      <Box marginBottom={1}>
        <Text dimColor>
          Press <Text color="cyan">Ctrl+S</Text> to save or <Text color="cyan">Esc</Text> to cancel
        </Text>
      </Box>
      <Box>
        <Text>Entry content: </Text>
        <TextInput
          value={content}
          onChange={setContent}
          placeholder="Start typing your entry..."
          focus
        />
      </Box>
      {content.length > 0 && (
        <Box marginTop={1}>
          <Text dimColor>Characters: {content.length}</Text>
        </Box>
      )}
    </Box>
  );
};
