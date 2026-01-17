import { useState } from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { Pressable } from '@/components/ui/pressable';
import { Alert, AlertIcon, AlertText } from '@/components/ui/alert';
import { CircleAlert } from 'lucide-react-native';

export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isRegister, setIsRegister] = useState(false);

    const { login, register } = useAuth();
    const router = useRouter();

    async function handleSubmit() {
        if (!username.trim() || !password.trim()) {
            setError('Vui lòng nhập tên đăng nhập và mật khẩu');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            if (isRegister) {
                await register(username.trim(), password);
            } else {
                await login(username.trim(), password);
            }
            router.replace('/(tabs)' as any);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
        >
            <View className="flex-1 justify-center px-6 bg-gradient-to-b from-violet-50 to-white" style={{ backgroundColor: '#F5F3FF' }}>
                {/* Logo/Title */}
                <VStack className="items-center mb-12" space="sm">
                    <Text className="text-6xl">💸</Text>
                    <Heading size="3xl" className="text-violet-700 font-bold">
                        Chia Tiền
                    </Heading>
                    <Text className="text-gray-500 text-center">
                        Chia sẻ chi phí dễ dàng với bạn bè
                    </Text>
                </VStack>

                {/* Login Card */}
                <Box className="bg-white rounded-3xl p-6 shadow-lg" style={{ shadowColor: '#7C3AED', shadowOpacity: 0.1, shadowRadius: 20, elevation: 8 }}>
                    <VStack space="lg">
                        {error && (
                            <Alert action="error" variant="solid" className="rounded-xl">
                                <AlertIcon as={CircleAlert} />
                                <AlertText>{error}</AlertText>
                            </Alert>
                        )}

                        <VStack space="xs">
                            <Text className="text-gray-600 text-sm font-medium ml-1">
                                Tên đăng nhập
                            </Text>
                            <Input
                                variant="outline"
                                size="xl"
                                className="rounded-xl bg-gray-50 border-gray-200"
                            >
                                <InputField
                                    value={username}
                                    onChangeText={setUsername}
                                    placeholder="Nhập tên đăng nhập"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    className="text-gray-900"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </Input>
                        </VStack>

                        <VStack space="xs">
                            <Text className="text-gray-600 text-sm font-medium ml-1">
                                Mật khẩu
                            </Text>
                            <Input
                                variant="outline"
                                size="xl"
                                className="rounded-xl bg-gray-50 border-gray-200"
                            >
                                <InputField
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="Nhập mật khẩu"
                                    secureTextEntry
                                    className="text-gray-900"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </Input>
                        </VStack>

                        <Button
                            size="xl"
                            onPress={handleSubmit}
                            disabled={isLoading}
                            className="rounded-xl mt-2"
                            style={{ backgroundColor: '#7C3AED' }}
                        >
                            {isLoading ? (
                                <ButtonSpinner color="white" />
                            ) : (
                                <ButtonText className="font-semibold text-white">
                                    {isRegister ? 'Đăng ký' : 'Đăng nhập'}
                                </ButtonText>
                            )}
                        </Button>

                        <Pressable onPress={() => setIsRegister(!isRegister)}>
                            <Text className="text-center text-gray-500">
                                {isRegister ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
                                <Text className="text-violet-600 font-semibold">
                                    {isRegister ? 'Đăng nhập' : 'Đăng ký'}
                                </Text>
                            </Text>
                        </Pressable>
                    </VStack>
                </Box>

                {/* Dev hint */}
                <Text className="text-center text-gray-400 text-xs mt-8">
                    Dev: đăng nhập với username="1", password="1"
                </Text>
            </View>
        </KeyboardAvoidingView>
    );
}
