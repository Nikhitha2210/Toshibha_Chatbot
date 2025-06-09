import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useThemeContext } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useThemeContext();
  const isDark = theme === 'dark';

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      activeOpacity={0.8}
      style={{
        width: 45,
        height: 22,
        borderRadius: 14,
        backgroundColor: isDark ? '#aaa' : '#e4e8ec',
        padding: 4,
        justifyContent: 'center',
        alignItems: isDark ? 'flex-end' : 'flex-start',
      }}
    >
      <View
        style={{
          width: 18,
          height: 18,
          backgroundColor: isDark ? '#1a1a1a' : '#fff',
          borderRadius: 10,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Feather
          name={isDark ? 'moon' : 'sun'}
          size={12}
          color={isDark ? '#FF6A00' : '#FF6A00'}
        />
      </View>
    </TouchableOpacity>
  );
};

export default ThemeToggle;