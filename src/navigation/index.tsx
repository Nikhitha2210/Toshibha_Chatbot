import React, { useEffect } from 'react';
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
    const { state } = useAuth();

    return (
        <NavigationContainer>
            <Stack.Navigator 
                screenOptions={{ 
                    headerShown: false,
                    // ✅ FIXED: Prevent gesture-based back navigation on authenticated screens
                    gestureEnabled: false,
                }}
                initialRouteName={state.isAuthenticated ? ROUTE_NAMES.Home : ROUTE_NAMES.Login}
            >
                {state.isAuthenticated ? (
                    // ✅ FIXED: Authenticated user stack - no login screen access
                    <>
                        <Stack.Screen 
                            name={ROUTE_NAMES.Home} 
                            component={HomeScreen}
                            options={{
                                gestureEnabled: false, // Prevent swipe back
                            }}
                        />
                        <Stack.Screen 
                            name={ROUTE_NAMES.AiAssist} 
                            component={AiAssistScreen}
                            options={{
                                gestureEnabled: true, // Allow swipe back to Home
                            }}
                        />
                        <Stack.Screen 
                            name={ROUTE_NAMES.Settings} 
                            component={SettingsScreen}
                            options={{
                                gestureEnabled: true, // Allow swipe back to previous screen
                            }}
                        />
                    </>
                ) : (
                    // ✅ FIXED: Unauthenticated user stack - only login screen
                    <Stack.Screen 
                        name={ROUTE_NAMES.Login} 
                        component={LoginScreen}
                        options={{
                            gestureEnabled: false, // No swipe back from login
                        }}
                    />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default Navigation;