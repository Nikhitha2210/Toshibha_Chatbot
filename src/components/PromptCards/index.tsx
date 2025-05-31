import React from 'react'

import { Text, TouchableOpacity, View } from 'react-native'

import { usePrompt } from '../../context/PromptContext'

import { styles } from './styles'
import IconAssets from '../../assets/icons/IconAssets'

const PromptCards = () => {
    const { setInputText } = usePrompt();

    const handleCardPress = (cardText: string) => {
        setInputText(cardText)
    }
    return (
        <View style={styles.promptCardsContainer}>

            <TouchableOpacity
                style={styles.card}
                onPress={() => handleCardPress('Part Number LookUp')}
                activeOpacity={0.7}
            >
                <View>
                    <IconAssets.Solid style={styles.cardIcon} />
                    <Text style={styles.cardTitle}>Part Number LookUp</Text>
                </View>
                <IconAssets.Arrow style={styles.cardArrow} />
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.card}
                onPress={() => handleCardPress('Troubleshooting')}
                activeOpacity={0.7}
            >
                <View>
                    <IconAssets.Speedometer style={styles.cardIcon} />
                    <Text style={styles.cardTitle}>Troubleshooting</Text>
                </View>
                <IconAssets.Arrow style={styles.cardArrow} />
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.card}
                onPress={() => handleCardPress('Technical Support')}
                activeOpacity={0.7}
            >
                <View>
                    <IconAssets.Speedometer style={styles.cardIcon} />
                    <Text style={styles.cardTitle}>Troubleshooting</Text>
                </View>
                <IconAssets.Arrow style={styles.cardArrow} />
            </TouchableOpacity>
        </View>

    )
}

export default PromptCards