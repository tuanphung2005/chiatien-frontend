import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { VStack } from '@/components/ui/vstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText, ButtonIcon } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import { LogOut, User, Bell, Moon } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsScreen() {
    const { user, logout } = useAuth();
    const router = useRouter();

    async function handleLogout() {
        await logout();
        router.replace('/(auth)/login' as any);
    }

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: '#F9FAFB' }}>
            <VStack className="flex-1 px-6 pt-4" space="lg">
                <Heading size="xl" className="text-gray-900">
                    Cài đặt
                </Heading>

                {/* Profile Card */}
                <Box className="bg-white rounded-2xl p-4" style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}>
                    <VStack className="items-center" space="md">
                        <Box className="w-20 h-20 rounded-full items-center justify-center" style={{ backgroundColor: '#7C3AED' }}>
                            <Text className="text-white font-bold text-3xl">
                                {(user?.displayName || 'U')[0].toUpperCase()}
                            </Text>
                        </Box>
                        <VStack className="items-center">
                            <Text className="text-gray-900 font-semibold text-lg">
                                {user?.displayName}
                            </Text>
                            <Text className="text-gray-500">@{user?.username}</Text>
                        </VStack>
                    </VStack>
                </Box>

                {/* Settings Options */}
                <VStack space="sm">
                    <SettingsItem icon={User} label="Chỉnh sửa hồ sơ" />
                    <SettingsItem icon={Bell} label="Thông báo" />
                    <SettingsItem icon={Moon} label="Giao diện" trailing="Sáng" />
                </VStack>

                <View className="flex-1" />

                {/* Logout Button */}
                <Button
                    variant="outline"
                    size="lg"
                    onPress={handleLogout}
                    className="rounded-xl mb-4"
                    style={{ borderColor: '#EF4444' }}
                >
                    <ButtonIcon as={LogOut} style={{ color: '#EF4444' }} className="mr-2" />
                    <ButtonText style={{ color: '#EF4444' }}>Đăng xuất</ButtonText>
                </Button>
            </VStack>
        </SafeAreaView>
    );
}

function SettingsItem({
    icon: Icon,
    label,
    trailing,
}: {
    icon: React.ElementType;
    label: string;
    trailing?: string;
}) {
    return (
        <Box className="bg-white rounded-xl px-4 py-3 flex-row items-center justify-between" style={{ shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 }}>
            <View className="flex-row items-center">
                <Icon size={20} color="#6B7280" />
                <Text className="text-gray-900 ml-3">{label}</Text>
            </View>
            {trailing && <Text className="text-gray-500">{trailing}</Text>}
        </Box>
    );
}
