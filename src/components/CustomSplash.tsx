import { useEffect, useRef } from 'react';
import {
    ActivityIndicator,
    Animated,
    Easing,
    StyleSheet,
    Text,
    View
} from 'react-native';

export default function CustomSplash({ message }: { message: string }) {
    const scale = useRef(new Animated.Value(0.9)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Fade in
        Animated.timing(opacity, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();

        // Looping pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(scale, {
                    toValue: 1.05,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(scale, {
                    toValue: 0.95,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <View style={styles.container}>
            <Animated.Image
                source={require('../../assets/images/skyobs-logo.jpg')}
                style={[
                    styles.logo,
                    {
                        transform: [{ scale }],
                        opacity,
                    },
                ]}
                resizeMode="contain"
                className={"rounded-3xl"}
            />

            <View className='flex-row gap-2'>
                <ActivityIndicator size="small" color="#007AFF" style={styles.spinner} />

                <Text style={styles.text}>{message}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: 160,
        height: 160,
        marginBottom: 24,
    },
    spinner: {
        marginBottom: 12,
    },
    text: {
        fontSize: 14,
        color: '#666',
    },
});