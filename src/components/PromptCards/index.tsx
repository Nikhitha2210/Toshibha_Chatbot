import React from 'react'

import { Image, Text, View } from 'react-native'

import { styles } from './styles'
import IconAssets from '../../assets/icons/IconAssets'

const PromptCards = () => {
    return (
        <View style={styles.promptCardsContainer}>
            <View style={styles.card}>
                <View>
                    <IconAssets.Solid style={styles.cardIcon} />
                    <Text style={styles.cardTitle}>Part Number LookUp</Text>
                </View>
                <IconAssets.Arrow style={styles.cardArrow} />
            </View>
            <View style={styles.card}>
                <View>
                    <IconAssets.Speedometer style={styles.cardIcon} />
                    <Text style={styles.cardTitle}>Troubleshooting</Text>
                </View>
                <IconAssets.Arrow style={styles.cardArrow} />
            </View>
            <View style={styles.card}>
                <View>
                    <IconAssets.Speedometer style={styles.cardIcon} />
                    <Text style={styles.cardTitle}>Troubleshooting</Text>
                </View>
                <IconAssets.Arrow style={styles.cardArrow} />
            </View>
        </View>

    )
}

export default PromptCards