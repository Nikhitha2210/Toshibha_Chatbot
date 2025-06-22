import React, { useRef, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ROUTE_NAMES } from './constants';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/Login/LoginScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import AiAssistScreen from '../screens/AiAssist/AiAssistScreen';
import SettingsScreen from '../components/Settings/settings';

const Stack = createNativeStackNavigator();

const Navigation = () => {
    const navigationRef = useRef<any>(null);
    const { setNavigationRef } = useAuth();

    // ✅ CRITICAL: Set navigation ref for session management
    useEffect(() => {
        if (navigationRef.current) {
            setNavigationRef(navigationRef.current);
            console.log('✅ Navigation ref set for session management');
        }
    }, [setNavigationRef]);

    return (
        <NavigationContainer 
            ref={navigationRef}
            onReady={() => {
                // ✅ Ensure navigation ref is set when navigation is ready
                if (navigationRef.current) {
                    setNavigationRef(navigationRef.current);
                    console.log('✅ Navigation ready - ref updated');
                }
            }}
        >
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name={ROUTE_NAMES.Login} component={LoginScreen} />
                <Stack.Screen name={ROUTE_NAMES.Home} component={HomeScreen} />
                <Stack.Screen name={ROUTE_NAMES.AiAssist} component={AiAssistScreen} />
                <Stack.Screen name={ROUTE_NAMES.Settings} component={SettingsScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default Navigation;