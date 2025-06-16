import { Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';

const MICROPHONE_PERMISSION =
    Platform.OS === 'ios'
        ? PERMISSIONS.IOS.MICROPHONE
        : PERMISSIONS.ANDROID.RECORD_AUDIO;

export const checkMicrophonePermission = async () => {
    const status = await check(MICROPHONE_PERMISSION);

    switch (status) {
        case RESULTS.UNAVAILABLE:
            console.warn('Microphone not available on this device.');
            return false;
        case RESULTS.DENIED:
            const requestResult = await request(MICROPHONE_PERMISSION);
            return requestResult === RESULTS.GRANTED;
        case RESULTS.LIMITED:
        case RESULTS.GRANTED:
            return true;
        case RESULTS.BLOCKED:
            openSettings().catch(() => {
                console.warn('Cannot open settings');
            });
            return false;
    }
};