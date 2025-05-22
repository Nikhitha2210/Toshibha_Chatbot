import React from 'react'

import { Image, Text, TouchableOpacity, View } from 'react-native'

import { styles } from './styles'

const PromptInput = () => {

    return (
        <View style={styles.askSection}>
            <Text style={styles.askText}>Ask Anything</Text>
            <View style={styles.askInputContainer}>
                <TouchableOpacity style={styles.askButton}><Text style={styles.btnText}>Search</Text></TouchableOpacity>
                <TouchableOpacity style={styles.askButton}><Text style={styles.btnText}>Deep Search</Text></TouchableOpacity>
                <Image source={require('../../assets/images/mic.png')} style={styles.micIcon} />
            </View>
        </View>
    )
}

export default PromptInput