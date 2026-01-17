import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VStack } from '@/components/ui/vstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';

export default function ActivityScreen() {
    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: '#F9FAFB' }}>
            <VStack className="flex-1 px-6 pt-4" space="lg">
                <Heading size="xl" className="text-gray-900">
                    Hoạt động
                </Heading>
                <View className="flex-1 items-center justify-center">
                    <Text className="text-6xl mb-4">📋</Text>
                    <Text className="text-gray-500 text-center">
                        Lịch sử chi tiêu sẽ hiển thị ở đây
                    </Text>
                </View>
            </VStack>
        </SafeAreaView>
    );
}
