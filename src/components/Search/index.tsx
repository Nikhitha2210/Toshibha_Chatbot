import React, { useState } from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';
import styles from './styles';
import IconAssets from '../../assets/icons/IconAssets';

const SearchComponent = ({
    onSearchFocus,
    onBackPress,
}: {
    onSearchFocus: () => void;
    onBackPress: () => void;
}) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = () => {
        setIsFocused(true);
        onSearchFocus();
    };

    const handleBack = () => {
        setIsFocused(false);
        onBackPress();
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
                    placeholder="Search"
                    style={styles.searchInput}
                    onFocus={handleFocus}
                />
                {isFocused && (
                    <TouchableOpacity onPress={() => { }}>
                        <IconAssets.Close style={styles.clearIcon} />
                    </TouchableOpacity>
                )}
            </View>
            <TouchableOpacity onPress={() => { }} style={styles.pencilIconWrapper}>
                <IconAssets.Microphone />
            </TouchableOpacity>
        </View>
    );
};

export default SearchComponent;