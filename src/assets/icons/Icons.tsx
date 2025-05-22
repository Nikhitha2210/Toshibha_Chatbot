import React from 'react';

import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

type IconProps = {
    name: string;
    size?: number;
    color?: string;
    style?: object;
};

export const FAIcon = ({ name, size = 20, color = 'black', style }: IconProps) => (
    <FontAwesome name={name} size={size} color={color} style={style} />
);

export const MIIcon = ({ name, size = 20, color = 'black', style }: IconProps) => (
    <MaterialIcons name={name} size={size} color={color} style={style} />
);

export const IonIcon = ({ name, size = 20, color = 'black', style }: IconProps) => (
    <Ionicons name={name} size={size} color={color} style={style} />
);