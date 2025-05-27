import React from 'react'

import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useNavigation } from '@react-navigation/native';

import styles from './AiAssistScreen.styles'
import Header from '../../components/header'
import PromptInput from '../../components/PromptInput'
import MessageCard from '../../components/MessageCard'
import IconAssets from '../../assets/icons/IconAssets';

const AiAssistScreen = () => {

    const navigation = useNavigation();

    const openMenu = () => {

    };

    return (
        <View style={styles.container}>
            <Header onMenuPress={openMenu} />
            <View style={styles.topBar}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <IconAssets.ArrowLeft />
                    </TouchableOpacity>
                    <Text style={styles.topBarTitle}>AI Assist</Text>
                </View>
                <TouchableOpacity onPress={() => console.log('Options')}>
                    <IconAssets.VerticalDots />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
                <MessageCard
                    time="01:30 AM"
                    message="Arcu gravida tortor varius fringilla eget facilisi morbi..."
                    highlight={{
                        title: "Canon EOS R100 Mirrorless Camera with 18–45mm Lens",
                        rating: 4.8,
                        reviews: 8399,
                        description: "Arcu gravida tortor varius fringilla eget facilisi morbi..."
                    }}
                />
                <MessageCard
                    time="01:30 AM"
                    message="Arcu gravida tortor varius fringilla eget facilisi morbi..."
                    highlight={{
                        title: "Canon EOS R100 Mirrorless Camera with 18–45mm Lens",
                        rating: 4.8,
                        reviews: 8399,
                        description: "Arcu gravida tortor varius fringilla eget facilisi morbi..."
                    }}
                />
                <MessageCard
                    time="01:30 AM"
                    message="Arcu gravida tortor varius fringilla eget facilisi morbi..."
                    highlight={{
                        title: "Canon EOS R100 Mirrorless Camera with 18–45mm Lens",
                        rating: 4.8,
                        reviews: 8399,
                        description: "Arcu gravida tortor varius fringilla eget facilisi morbi..."
                    }}
                />
                <MessageCard
                    time="01:30 AM"
                    message="Arcu gravida tortor varius fringilla eget facilisi morbi..."
                    highlight={{
                        title: "Canon EOS R100 Mirrorless Camera with 18–45mm Lens",
                        rating: 4.8,
                        reviews: 8399,
                        description: "Arcu gravida tortor varius fringilla eget facilisi morbi..."
                    }}
                />
                <MessageCard
                    time="01:30 AM"
                    message="Arcu gravida tortor varius fringilla eget facilisi morbi..."
                    highlight={{
                        title: "Canon EOS R100 Mirrorless Camera with 18–45mm Lens",
                        rating: 4.8,
                        reviews: 8399,
                        description: "Arcu gravida tortor varius fringilla eget facilisi morbi..."
                    }}
                />
                <MessageCard
                    time="01:30 AM"
                    message="Arcu gravida tortor varius fringilla eget facilisi morbi..."
                    highlight={{
                        title: "Canon EOS R100 Mirrorless Camera with 18–45mm Lens",
                        rating: 4.8,
                        reviews: 8399,
                        description: "Arcu gravida tortor varius fringilla eget facilisi morbi..."
                    }}
                />
            </ScrollView>

            <View style={styles.wrapper}>
                <View style={styles.inputContainer}>
                    <PromptInput />
                </View>
            </View>

        </View >
    )
}

export default AiAssistScreen