import { useState } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react-native';
import { groupsApi } from '@/lib/api';

const EMOJIS = ['💰', '🏠', '🍔', '✈️', '🎉', '🛒', '⚽', '🎬', '🎮', '🏔️', '🚗', '💼'];

export default function CreateGroupScreen() {
    const [name, setName] = useState('');
    const [emoji, setEmoji] = useState('💰');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();

    async function handleCreate() {
        if (!name.trim()) {
            setError('Vui lòng nhập tên nhóm');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const group = await groupsApi.create({
                name: name.trim(),
                emoji,
                description: description.trim() || undefined,
            });
            router.replace(`/group/${group.id}` as any);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTransparent: true,
                    headerTitle: '',
                    headerLeft: () => (
                        <Pressable onPress={() => router.back()}>
                            <ChevronLeft size={28} color="#7C3AED" />
                        </Pressable>
                    ),
                }}
            />
            <SafeAreaView className="flex-1" style={{ backgroundColor: '#F9FAFB' }}>
                <ScrollView className="flex-1 px-6 pt-12">
                    <VStack space="lg">
                        <Heading size="2xl" className="text-gray-900">
                            Tạo nhóm mới
                        </Heading>

                        {/* Emoji Picker */}
                        <VStack space="sm">
                            <Text className="text-gray-600 font-medium">Biểu tượng</Text>
                            <HStack className="flex-wrap gap-3">
                                {EMOJIS.map((e) => (
                                    <Pressable key={e} onPress={() => setEmoji(e)}>
                                        <Box
                                            className="w-12 h-12 rounded-xl items-center justify-center"
                                            style={{
                                                backgroundColor: emoji === e ? '#EDE9FE' : '#F3F4F6',
                                                borderWidth: emoji === e ? 2 : 0,
                                                borderColor: '#7C3AED',
                                            }}
                                        >
                                            <Text className="text-2xl">{e}</Text>
                                        </Box>
                                    </Pressable>
                                ))}
                            </HStack>
                        </VStack>

                        {/* Name Input */}
                        <VStack space="xs">
                            <Text className="text-gray-600 font-medium">Tên nhóm *</Text>
                            <Input variant="outline" size="xl" className="rounded-xl bg-white border-gray-200">
                                <InputField
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="VD: Nhà trọ 123, Trip Đà Lạt..."
                                    className="text-gray-900"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </Input>
                        </VStack>

                        {/* Description Input */}
                        <VStack space="xs">
                            <Text className="text-gray-600 font-medium">Mô tả (tùy chọn)</Text>
                            <Input variant="outline" size="xl" className="rounded-xl bg-white border-gray-200">
                                <InputField
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder="Chi tiêu chung của..."
                                    className="text-gray-900"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </Input>
                        </VStack>

                        {error && <Text style={{ color: '#EF4444' }} className="text-center">{error}</Text>}

                        <Button
                            size="xl"
                            onPress={handleCreate}
                            disabled={isLoading}
                            className="rounded-xl mt-4"
                            style={{ backgroundColor: '#7C3AED' }}
                        >
                            {isLoading ? <ButtonSpinner color="white" /> : <ButtonText className="font-semibold text-white">Tạo nhóm</ButtonText>}
                        </Button>
                    </VStack>
                </ScrollView>
            </SafeAreaView>
        </>
    );
}
