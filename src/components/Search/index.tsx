import React, { useRef, useState } from 'react';

import { TextInput, TouchableOpacity, View } from 'react-native';
import { getStyles } from './styles';
import IconAssets from '../../assets/icons/IconAssets';
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
                        <IconAssets.ArrowLeft style={styles.searchIcon} />
                    </TouchableOpacity>
                ) : (
                    <IconAssets.Search style={styles.searchIcon} />
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
                        <IconAssets.Close style={styles.clearIcon} />
                    </TouchableOpacity>
                )}
            </View>
            <TouchableOpacity onPress={onEditPress} style={styles.pencilIconWrapper}>
                <IconAssets.NewChat />
            </TouchableOpacity>
        </View>
    );
};

export default SearchComponent;