import React from 'react'

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ROUTE_NAMES } from './constants';

import LoginScreen from '../screens/Login/LoginScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import AiAssistScreen from '../screens/AiAssist/AiAssistScreen';
import SettingsScreen from '../components/Settings/settings';

const Stack = createNativeStackNavigator();

const Navigation = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name={ROUTE_NAMES.Login} component={LoginScreen} />
                <Stack.Screen name={ROUTE_NAMES.Home} component={HomeScreen} />
                <Stack.Screen name={ROUTE_NAMES.AiAssist} component={AiAssistScreen} />
                <Stack.Screen name={ROUTE_NAMES.Settings} component={SettingsScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    )
}

export default Navigation