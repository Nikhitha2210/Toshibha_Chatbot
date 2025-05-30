import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Colors from '../../theme/colors';

const ListeningDots = () => {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    const animateDot = (dot: Animated.Value, delay: number) => {
        return Animated.loop(
            Animated.sequence([
                Animated.timing(dot, {
                    toValue: 1,
                    duration: 300,
                    delay,
                    useNativeDriver: true,
                    easing: Easing.linear,
                }),
                Animated.timing(dot, {
                    toValue: 0.3,
                    duration: 300,
                    useNativeDriver: true,
                    easing: Easing.linear,
                }),
            ])
        ).start();
    };

    useEffect(() => {
        animateDot(dot1, 0);
        animateDot(dot2, 150);
        animateDot(dot3, 300);
    }, []);

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            {[dot1, dot2, dot3].map((dot, index) => (
                <Animated.View
                    key={index}
                    style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: Colors.dark.primary,
                        opacity: dot,
                    }}
                />
            ))}
        </View>
    );
};

export default ListeningDots;