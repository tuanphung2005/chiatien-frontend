import { Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Box } from '@/components/ui/box';
import { Camera, Image as ImageIcon, FileText } from 'lucide-react-native';

export default function AddScreen() {
    const router = useRouter();

    const options = [
        {
            icon: Camera,
            title: 'Chụp hóa đơn',
            description: 'AI sẽ tự động phân tích và chia tiền',
            color: '#7C3AED',
            bgColor: '#EDE9FE',
            route: '/expense/camera',
        },
        {
            icon: ImageIcon,
            title: 'Chọn ảnh',
            description: 'Chọn ảnh hóa đơn từ thư viện',
            color: '#10B981',
            bgColor: '#D1FAE5',
            route: '/expense/gallery',
        },
        {
            icon: FileText,
            title: 'Nhập thủ công',
            description: 'Tự nhập thông tin chi tiêu',
            color: '#F59E0B',
            bgColor: '#FEF3C7',
            route: '/expense/manual',
        },
    ];

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: '#F9FAFB' }}>
            <VStack className="flex-1 px-6 pt-4" space="lg">
                <Heading size="xl" className="text-gray-900">
                    Thêm chi tiêu
                </Heading>

                <Text className="text-gray-500">
                    Chọn cách thêm chi tiêu mới
                </Text>

                <VStack space="md" className="mt-4">
                    {options.map((option, index) => (
                        <Pressable
                            key={index}
                            onPress={() => router.push(option.route as any)}
                        >
                            <Box
                                className="bg-white rounded-2xl p-5"
                                style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}
                            >
                                <HStack space="lg" className="items-center">
                                    <Box
                                        className="w-14 h-14 rounded-xl items-center justify-center"
                                        style={{ backgroundColor: option.bgColor }}
                                    >
                                        <option.icon size={28} color={option.color} />
                                    </Box>
                                    <VStack className="flex-1">
                                        <Text className="text-gray-900 font-semibold text-lg">
                                            {option.title}
                                        </Text>
                                        <Text className="text-gray-500 text-sm">
                                            {option.description}
                                        </Text>
                                    </VStack>
                                </HStack>
                            </Box>
                        </Pressable>
                    ))}
                </VStack>
            </VStack>
        </SafeAreaView>
    );
}
