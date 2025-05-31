import React from 'react'

import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import styles from './AiAssistScreen.styles'
import Header from '../../components/header'
import PromptInput from '../../components/PromptInput'
import MessageCard from '../../components/MessageCard'
import IconAssets from '../../assets/icons/IconAssets';

export type PromptType = {
    id: string;
    time: string;
    message: string;
    highlight: {
        title: string;
        rating: number;
        reviews: number;
        description: string;
    };
};

type RootStackParamList = {
    Login: undefined;
    Home: undefined;
    AiAssist: { promptData: PromptType };
};

type RouteProps = RouteProp<RootStackParamList, 'AiAssist'>;

const AiAssistScreen = () => {

    const route = useRoute<RouteProps>();
    const { promptData } = route.params;

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
                    key={promptData.id}
                    time={promptData?.time}
                    message={promptData?.message}
                    highlight={promptData?.highlight}
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