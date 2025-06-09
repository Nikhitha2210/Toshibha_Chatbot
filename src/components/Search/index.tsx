import React, { useRef, useState } from 'react';

import { TextInput, TouchableOpacity, View } from 'react-native';
import { getStyles } from './styles';
import { getThemedIcon } from '../../assets/icons/IconAssets';
import { useThemeContext } from '../../context/ThemeContext';

interface SearchComponentProps {
    onFocus?: () => void;
    onBlur?: () => void;
    onEditPress?: () => void;
}

const SearchComponent: React.FC<SearchComponentProps> = ({ onFocus, onBlur, onEditPress }) => {
    const [isFocused, setIsFocused] = useState(false);
    const [searchText, setSearchText] = useState('');

    const { theme } = useThemeContext();
    const styles = getStyles(theme);

    const inputRef = useRef<TextInput>(null);

    const ThemedSearchIcon = getThemedIcon('Search', theme);
    const ThemedNewChatIcon = getThemedIcon('NewChat', theme);
    const ThemedBackIcon = getThemedIcon('ArrowLeft', theme);
    const ThemedCloseIcon = getThemedIcon('Close', theme);

    const handleFocus = () => {
        setIsFocused(true);
        onFocus && onFocus();
    };

    const handleBack = () => {
        setIsFocused(false);
        onBlur && onBlur();
        inputRef.current?.blur();
    };

    const handleClear = () => {
        setSearchText('');
        inputRef.current?.clear();
        inputRef.current?.blur();
        setIsFocused(false);
        onBlur?.();
    };

    return (
        <View style={styles.container}>
            <View style={styles.searchWrapper}>
                {isFocused ? (
                    <TouchableOpacity onPress={handleBack}>
                        {ThemedBackIcon && <ThemedBackIcon style={styles.searchIcon} />}
                    </TouchableOpacity>
                ) : (
                    ThemedSearchIcon && <ThemedSearchIcon style={styles.searchIcon} />
                )}
                <TextInput
                    ref={inputRef}
                    placeholder="Search"
                    style={styles.searchInput}
                    value={searchText}
                    onChangeText={setSearchText}
                    onFocus={handleFocus}
                    onBlur={() => {
                        setIsFocused(false);
                        onBlur && onBlur();
                    }}
                />
                {searchText.length > 0 && (
                    <TouchableOpacity onPress={handleClear}>
                        {ThemedCloseIcon && <ThemedCloseIcon style={styles.searchIcon} />}
                    </TouchableOpacity>
                )}
            </View>
            <TouchableOpacity onPress={onEditPress} style={styles.pencilIconWrapper}>
                {ThemedNewChatIcon && <ThemedNewChatIcon />}
            </TouchableOpacity>
        </View>
    );
};

export default SearchComponent;