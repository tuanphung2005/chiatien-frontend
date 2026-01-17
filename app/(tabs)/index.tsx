import { Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { VStack } from '@/components/ui/vstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Box } from '@/components/ui/box';
import { Camera, Eye } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const CARD_HEIGHT = height * 0.35;

interface IntentCardProps {
    icon: React.ElementType;
    title: string;
    subtitle: string;
    colors: [string, string];
    onPress: () => void;
}

function IntentCard({ icon: Icon, title, subtitle, colors, onPress }: IntentCardProps) {
    return (
        <Pressable onPress={onPress} style={{ width: width - 48 }}>
            <LinearGradient
                colors={colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    height: CARD_HEIGHT,
                    borderRadius: 32,
                    padding: 28,
                    justifyContent: 'space-between',
                }}
            >
                <Box
                    className="w-16 h-16 rounded-2xl items-center justify-center"
                    style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                >
                    <Icon size={32} color="#FFFFFF" />
                </Box>
                <VStack>
                    <Heading size="2xl" className="text-white">
                        {title}
                    </Heading>
                    <Text className="text-white/80 text-lg mt-1">
                        {subtitle}
                    </Text>
                </VStack>
            </LinearGradient>
        </Pressable>
    );
}

export default function IntentScreen() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: '#F9FAFB' }}>
            <VStack className="flex-1 px-6 pt-12 pb-8 justify-center items-center" space="xl">
                <VStack className="items-center mb-8">
                    <Text className="text-5xl mb-4">💸</Text>
                    <Heading size="2xl" className="text-gray-900 text-center">
                        Bạn muốn làm gì?
                    </Heading>
                </VStack>

                <VStack space="lg" className="items-center">
                    <IntentCard
                        icon={Camera}
                        title="Nhập chi tiêu"
                        subtitle="Chụp hoặc thêm hóa đơn mới"
                        colors={['#7C3AED', '#A855F7']}
                        onPress={() => router.push('/(tabs)/add')}
                    />

                    <IntentCard
                        icon={Eye}
                        title="Kiểm tra"
                        subtitle="Xem lại các chi tiêu gần đây"
                        colors={['#10B981', '#34D399']}
                        onPress={() => router.push('/(tabs)/stories' as never)}
                    />
                </VStack>
            </VStack>
        </SafeAreaView>
    );
}
