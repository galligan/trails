import { Box, Text } from 'ink';
import React from 'react';

interface ErrorMessageProps {
  error: Error | string;
  suggestion?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, suggestion }) => {
  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box>
        <Text color="red" bold>
          ❌ Error:
        </Text>
        <Text color="red"> {errorMessage}</Text>
      </Box>
      {suggestion && (
        <Box marginTop={1}>
          <Text color="yellow">💡 Suggestion: {suggestion}</Text>
        </Box>
      )}
    </Box>
  );
};
