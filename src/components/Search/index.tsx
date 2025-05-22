import React from 'react'

import { Image, TextInput, TouchableOpacity, View } from 'react-native'
import styles from './styles'

const SearchComponent = () => {
    return (
        <View style={styles.container}>
            <View style={styles.searchWrapper}>
                <Image source={require('../../assets/images/search.png')} style={styles.searchIcon} />
                <TextInput placeholder='Search' style={styles.searchInput} />
            </View>
            <TouchableOpacity onPress={() => { }} style={styles.pencilIconWrapper}>
                <Image source={require('../../assets/images/mic.png')} style={styles.pencilIcon} />
            </TouchableOpacity>
        </View>
    )
}

export default SearchComponent