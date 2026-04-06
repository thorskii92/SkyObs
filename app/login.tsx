import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { FormControl, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import { Heading } from '@/components/ui/heading';
import { Image } from '@/components/ui/image';
import { Input, InputField } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useUser } from '@/src/context/UserContext';
import { loginUser } from '@/src/utils/api';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, SafeAreaView } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    const db = useSQLiteContext();

    const { login } = useUser(); // ✅ use context

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert('Error', 'Please enter both username and password');
            return;
        }

        setIsLoading(true);

        try {
            const userData = await loginUser(username, password);
            // ✅ use context login instead of direct DB write
            await login(db, userData);

            Alert.alert('Success', 'Login successful');

            router.replace('/(main)');
        } catch (error: any) {
            Alert.alert('Login Failed', error.message || 'Invalid credentials');
            setPassword('');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAwareScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ flexGrow: 1 }}
            >
                <Box className="flex-1 justify-center px-12 shadow-xl">

                    <Box className="bg-blue-400 rounded-3xl px-6 py-8 shadow-lg">

                        <VStack space="md" className="w-full">

                            {/* Header */}
                            <Box className="items-center">
                                <Image
                                    source={require('@/assets/images/skyobs-logo.jpg')}
                                    alt="SkyObs Logo"
                                    className="mb-8 rounded-3xl w-20 h-20"
                                />
                                <Heading size="xl" className="text-white text-center">
                                    SkyObs Login
                                </Heading>
                                <Text className="text-white/80 text-center">
                                    Please enter your credentials
                                </Text>
                            </Box>

                            {/* Username */}
                            <FormControl>
                                <FormControlLabel>
                                    <FormControlLabelText className="text-white">
                                        Username
                                    </FormControlLabelText>
                                </FormControlLabel>
                                <Input className="bg-white rounded-xl">
                                    <InputField
                                        placeholder="Enter username"
                                        placeholderTextColor="#9CA3AF"
                                        value={username}
                                        onChangeText={setUsername}
                                        autoCapitalize="none"
                                    />
                                </Input>
                            </FormControl>

                            {/* Password */}
                            <FormControl>
                                <FormControlLabel>
                                    <FormControlLabelText className="text-white">
                                        Password
                                    </FormControlLabelText>
                                </FormControlLabel>
                                <Input className="bg-white rounded-xl">
                                    <InputField
                                        placeholder="Enter password"
                                        placeholderTextColor="#9CA3AF"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                    />
                                </Input>
                            </FormControl>

                            {/* Button */}
                            <Button
                                onPress={handleLogin}
                                disabled={isLoading}
                                className="mt-4 bg-white rounded-xl"
                            >
                                <ButtonText className="text-blue-400 font-semibold">
                                    {isLoading ? 'Logging in...' : 'Login'}
                                </ButtonText>
                            </Button>

                        </VStack>
                    </Box>

                </Box>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
}