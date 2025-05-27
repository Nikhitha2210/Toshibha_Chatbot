import { StyleSheet } from 'react-native';

import Colors from '../../theme/colors';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background2,
        paddingTop: 20
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingTop: 25,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.stroke
    },
    topBarTitle: {
        fontSize: 18,
        color: Colors.dark.subText,
        fontWeight: '600',
    },
    scrollContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 10
    },
    scrollContent: {
        paddingBottom: 20,
    },
    wrapper: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        backgroundColor: Colors.dark.stroke,
        paddingTop: 1
    },
    inputContainer: {
        backgroundColor: Colors.dark.background2,
        borderTopLeftRadius: 19,
        borderTopRightRadius: 19,
        paddingVertical: 20,
        paddingHorizontal: 20
    }
});

export default styles;