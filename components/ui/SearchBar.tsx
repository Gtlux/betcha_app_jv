import React, { useState, useRef, useCallback } from 'react';
import { TextInput, StyleSheet, Pressable } from 'react-native';
import Box from '@/components/ui/Box';
import Text from '@/components/ui/Text';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  onSearch,
  placeholder = 'Ieškoti quest\'ų...',
}: SearchBarProps) {
  const [value, setValue] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (text: string) => {
      setValue(text);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        onSearch(text.trim());
      }, 300);
    },
    [onSearch],
  );

  const handleClear = useCallback(() => {
    setValue('');
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    onSearch('');
  }, [onSearch]);

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      backgroundColor="surfaceContainerHigh"
      borderRadius={12}
      paddingHorizontal="m"
      marginBottom="m"
    >
      <Text style={styles.icon}>🔍</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.4)"
        autoCapitalize="none"
        autoCorrect={false}
        testID="search-bar-input"
      />
      {value.length > 0 && (
        <Pressable onPress={handleClear} hitSlop={8} testID="search-bar-clear">
          <Text style={styles.clearIcon}>✕</Text>
        </Pressable>
      )}
    </Box>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 12,
  },
  clearIcon: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    padding: 4,
  },
});
