import React from 'react'

import { Image, Text, View } from 'react-native'

import { styles } from './styles'

const PromptCards = () => {
    return (
        <View style={styles.promptCardsContainer}>
            <View style={styles.card}>
                <View>
                    <Image source={require('../../assets/images/solid.png')} style={styles.cardIcon} />
                    <Text style={styles.cardTitle}>Part Number LookUp</Text>
                </View>
                <Image source={require('../../assets/images/arrow.png')} style={styles.cardArrow} />
            </View>
            <View style={styles.card}>
                <View>
                    <Image source={require('../../assets/images/speedometer.png')} style={styles.cardIcon} />
                    <Text style={styles.cardTitle}>Troubleshooting</Text>
                </View>
                <Image source={require('../../assets/images/arrow.png')} style={styles.cardArrow} />
            </View>
            <View style={styles.card}>
                <View>
                    <Image source={require('../../assets/images/speedometer.png')} style={styles.cardIcon} />
                    <Text style={styles.cardTitle}>Troubleshooting</Text>
                </View>
                <Image source={require('../../assets/images/arrow.png')} style={styles.cardArrow} />
            </View>
        </View>

    )
}

export default PromptCards