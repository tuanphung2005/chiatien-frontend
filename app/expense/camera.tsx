import { useState, useEffect } from 'react';
import { View, Image, Pressable, ScrollView, TextInput, Switch } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Avatar, AvatarFallbackText } from '@/components/ui/avatar';
import { ChevronLeft, Camera, Sparkles, Check, Edit, ChevronDown } from 'lucide-react-native';
import { receiptsApi, expensesApi, groupsApi, Group, GroupMember } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface ParsedItem {
    name: string;
    price: number;
    quantity: number;
    selected: boolean;
}

interface ParticipantState {
    userId: string;
    displayName: string;
    selected: boolean;
    amount: number;
}

export default function CameraExpenseScreen() {
    const { groupId } = useLocalSearchParams<{ groupId?: string }>();
    const { user } = useAuth();
    const router = useRouter();

    const [image, setImage] = useState<string | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
    const [receiptId, setReceiptId] = useState<string | null>(null);
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(groupId || null);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

    const [payerId, setPayerId] = useState<string>(user?.id || '');
    const [participants, setParticipants] = useState<ParticipantState[]>([]);
    const [splitEqually, setSplitEqually] = useState(true);
    const [showPayerPicker, setShowPayerPicker] = useState(false);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadGroups();
    }, []);

    useEffect(() => {
        if (selectedGroupId && groups.length > 0) {
            const group = groups.find(g => g.id === selectedGroupId);
            if (group) {
                setSelectedGroup(group);
                initParticipants(group.members);
            }
        }
    }, [selectedGroupId, groups]);

    const selectedTotal = parsedItems
        .filter(item => item.selected)
        .reduce((sum, item) => sum + item.price * item.quantity, 0);

    const selectedParticipantCount = participants.filter(p => p.selected).length;

    useEffect(() => {
        if (splitEqually && participants.length > 0 && selectedParticipantCount > 0) {
            const perPerson = Math.round(selectedTotal / selectedParticipantCount);
            setParticipants(prev => prev.map(p => ({
                ...p,
                amount: p.selected ? perPerson : 0,
            })));
        }
    }, [selectedTotal, splitEqually, selectedParticipantCount]);

    async function loadGroups() {
        try {
            const data = await groupsApi.list();
            setGroups(data);
            if (!selectedGroupId && data.length > 0) {
                setSelectedGroupId(data[0].id);
            }
        } catch (err) {
            console.error('error loading groups:', err);
        }
    }

    function initParticipants(members: GroupMember[]) {
        setParticipants(members.map(m => ({
            userId: m.id,
            displayName: m.displayName,
            selected: true,
            amount: 0,
        })));
        if (user?.id && members.find(m => m.id === user.id)) {
            setPayerId(user.id);
        } else if (members.length > 0) {
            setPayerId(members[0].id);
        }
    }

    async function pickImage() {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            setImage(result.assets[0].uri);
            await parseReceipt(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
    }

    async function takePhoto() {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            setError('Cần quyền truy cập camera');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            setImage(result.assets[0].uri);
            await parseReceipt(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
    }

    async function parseReceipt(base64: string) {
        setIsParsing(true);
        setError(null);

        try {
            const data = await receiptsApi.parse(base64);
            setParsedItems(data.items.map(item => ({ ...item, selected: true })));
            setReceiptId(data.receiptId);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Không thể phân tích hóa đơn');
        } finally {
            setIsParsing(false);
        }
    }

    function toggleItem(index: number) {
        setParsedItems(items =>
            items.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item))
        );
    }

    function toggleParticipant(userId: string) {
        setParticipants(prev => prev.map(p =>
            p.userId === userId ? { ...p, selected: !p.selected } : p
        ));
    }

    function updateParticipantAmount(userId: string, value: string) {
        const numericValue = parseInt(value.replace(/\./g, ''), 10) || 0;
        setParticipants(prev => prev.map(p =>
            p.userId === userId ? { ...p, amount: numericValue } : p
        ));
    }

    async function handleCreateExpense() {
        if (!selectedGroupId) {
            setError('Vui lòng chọn nhóm');
            return;
        }

        const selectedItems = parsedItems.filter(item => item.selected);
        if (selectedItems.length === 0) {
            setError('Vui lòng chọn ít nhất 1 món');
            return;
        }

        const selectedParticipants = participants.filter(p => p.selected);
        if (selectedParticipants.length === 0) {
            setError('Vui lòng chọn ít nhất 1 người tham gia');
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            const description = selectedItems.length === 1
                ? selectedItems[0].name
                : `${selectedItems.length} món (${selectedItems[0].name}...)`;

            await expensesApi.create({
                groupId: selectedGroupId,
                amount: selectedTotal,
                description,
                paidById: payerId,
                participants: selectedParticipants.map(p => ({
                    userId: p.userId,
                    amount: p.amount,
                })),
                receiptId: receiptId || undefined,
            });

            router.replace(`/group/${selectedGroupId}` as never);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Không thể tạo chi tiêu');
        } finally {
            setIsCreating(false);
        }
    }

    const payer = participants.find(p => p.userId === payerId);

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
                <ScrollView className="flex-1 px-6 pt-12" showsVerticalScrollIndicator={false}>
                    <VStack space="lg">
                        <VStack space="xs">
                            <Heading size="2xl" className="text-gray-900">Chụp hóa đơn</Heading>
                            <Text className="text-gray-500">AI sẽ tự động phân tích và chia tiền</Text>
                        </VStack>

                        {!image ? (
                            <VStack space="md" className="py-8">
                                <Pressable onPress={takePhoto}>
                                    <Box
                                        className="border-2 border-dashed rounded-2xl p-8 items-center"
                                        style={{ backgroundColor: '#EDE9FE', borderColor: '#7C3AED' }}
                                    >
                                        <Camera size={48} color="#7C3AED" />
                                        <Text style={{ color: '#7C3AED' }} className="font-medium mt-3">
                                            Chụp ảnh hóa đơn
                                        </Text>
                                    </Box>
                                </Pressable>

                                <Text className="text-gray-400 text-center">hoặc</Text>

                                <Button
                                    variant="outline"
                                    size="lg"
                                    onPress={pickImage}
                                    className="rounded-xl"
                                    style={{ borderColor: '#D1D5DB' }}
                                >
                                    <ButtonText className="text-gray-700">Chọn từ thư viện</ButtonText>
                                </Button>
                            </VStack>
                        ) : (
                            <VStack space="lg">
                                <Box className="rounded-2xl overflow-hidden">
                                    <Image
                                        source={{ uri: image }}
                                        className="w-full h-48"
                                        resizeMode="cover"
                                    />
                                    {isParsing && (
                                        <View
                                            className="absolute inset-0 items-center justify-center"
                                            style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
                                        >
                                            <Spinner size="large" />
                                            <HStack className="items-center mt-3" space="sm">
                                                <Sparkles size={16} color="#7C3AED" />
                                                <Text style={{ color: '#7C3AED' }}>AI đang phân tích...</Text>
                                            </HStack>
                                        </View>
                                    )}
                                </Box>

                                {parsedItems.length > 0 && (
                                    <VStack space="md">
                                        <HStack className="justify-between items-center">
                                            <Text className="text-gray-900 font-semibold">Các món đã nhận diện</Text>
                                            <Pressable onPress={() => { setImage(null); setParsedItems([]); }}>
                                                <HStack className="items-center" space="xs">
                                                    <Edit size={14} color="#7C3AED" />
                                                    <Text style={{ color: '#7C3AED' }} className="text-sm">Chụp lại</Text>
                                                </HStack>
                                            </Pressable>
                                        </HStack>

                                        <VStack space="sm">
                                            {parsedItems.map((item, index) => (
                                                <Pressable key={index} onPress={() => toggleItem(index)}>
                                                    <Box
                                                        className="rounded-xl p-4"
                                                        style={{
                                                            backgroundColor: item.selected ? '#EDE9FE' : '#FFFFFF',
                                                            borderWidth: 1,
                                                            borderColor: item.selected ? '#7C3AED' : '#E5E7EB',
                                                        }}
                                                    >
                                                        <HStack className="justify-between items-center">
                                                            <HStack className="items-center flex-1" space="md">
                                                                <Box
                                                                    className="w-6 h-6 rounded-full items-center justify-center"
                                                                    style={{ backgroundColor: item.selected ? '#7C3AED' : '#E5E7EB' }}
                                                                >
                                                                    {item.selected && <Check size={14} color="white" />}
                                                                </Box>
                                                                <VStack className="flex-1">
                                                                    <Text className="text-gray-900">{item.name}</Text>
                                                                    <Text className="text-gray-500 text-sm">x{item.quantity}</Text>
                                                                </VStack>
                                                            </HStack>
                                                            <Text className="text-gray-900 font-medium">
                                                                {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                                                            </Text>
                                                        </HStack>
                                                    </Box>
                                                </Pressable>
                                            ))}
                                        </VStack>

                                        <Box className="rounded-xl p-4" style={{ backgroundColor: '#D1FAE5' }}>
                                            <HStack className="justify-between items-center">
                                                <Text className="text-gray-900 font-medium">Tổng cộng</Text>
                                                <Text className="font-bold text-xl" style={{ color: '#10B981' }}>
                                                    {selectedTotal.toLocaleString('vi-VN')}₫
                                                </Text>
                                            </HStack>
                                        </Box>

                                        <VStack space="sm">
                                            <Text className="text-gray-600 font-medium">Nhóm</Text>
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                                <HStack space="sm">
                                                    {groups.map(group => (
                                                        <Pressable
                                                            key={group.id}
                                                            onPress={() => setSelectedGroupId(group.id)}
                                                        >
                                                            <Box
                                                                className="px-4 py-2 rounded-full"
                                                                style={{
                                                                    backgroundColor: selectedGroupId === group.id
                                                                        ? '#7C3AED'
                                                                        : '#F3F4F6'
                                                                }}
                                                            >
                                                                <Text
                                                                    style={{
                                                                        color: selectedGroupId === group.id
                                                                            ? 'white'
                                                                            : '#374151'
                                                                    }}
                                                                >
                                                                    {group.emoji} {group.name}
                                                                </Text>
                                                            </Box>
                                                        </Pressable>
                                                    ))}
                                                </HStack>
                                            </ScrollView>
                                        </VStack>

                                        {selectedGroup && (
                                            <>
                                                <VStack space="sm">
                                                    <Text className="text-gray-600 font-medium">Người trả</Text>
                                                    <Pressable onPress={() => setShowPayerPicker(!showPayerPicker)}>
                                                        <Box className="bg-white border border-gray-200 rounded-xl p-4 flex-row items-center justify-between">
                                                            <HStack className="items-center" space="sm">
                                                                <Avatar size="sm" style={{ backgroundColor: '#7C3AED' }}>
                                                                    <AvatarFallbackText>
                                                                        {payer?.displayName || ''}
                                                                    </AvatarFallbackText>
                                                                </Avatar>
                                                                <Text className="text-gray-900 font-medium">
                                                                    {payer?.displayName || 'Chọn người trả'}
                                                                </Text>
                                                            </HStack>
                                                            <ChevronDown size={20} color="#9CA3AF" />
                                                        </Box>
                                                    </Pressable>

                                                    {showPayerPicker && (
                                                        <Box className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                                            {participants.map(p => (
                                                                <Pressable
                                                                    key={p.userId}
                                                                    onPress={() => {
                                                                        setPayerId(p.userId);
                                                                        setShowPayerPicker(false);
                                                                    }}
                                                                >
                                                                    <HStack className="p-3 items-center justify-between border-b border-gray-100">
                                                                        <HStack className="items-center" space="sm">
                                                                            <Avatar size="xs" style={{ backgroundColor: '#7C3AED' }}>
                                                                                <AvatarFallbackText>{p.displayName}</AvatarFallbackText>
                                                                            </Avatar>
                                                                            <Text className="text-gray-900">{p.displayName}</Text>
                                                                        </HStack>
                                                                        {p.userId === payerId && <Check size={18} color="#7C3AED" />}
                                                                    </HStack>
                                                                </Pressable>
                                                            ))}
                                                        </Box>
                                                    )}
                                                </VStack>

                                                <VStack space="sm">
                                                    <HStack className="justify-between items-center">
                                                        <Text className="text-gray-600 font-medium">Chia cho</Text>
                                                        <HStack className="items-center" space="sm">
                                                            <Text className="text-gray-500 text-sm">Chia đều</Text>
                                                            <Switch
                                                                value={splitEqually}
                                                                onValueChange={setSplitEqually}
                                                                trackColor={{ false: '#E5E7EB', true: '#A78BFA' }}
                                                                thumbColor={splitEqually ? '#7C3AED' : '#9CA3AF'}
                                                            />
                                                        </HStack>
                                                    </HStack>

                                                    <Box className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                                        {participants.map((p, idx) => (
                                                            <HStack
                                                                key={p.userId}
                                                                className={`p-4 items-center justify-between ${idx < participants.length - 1 ? 'border-b border-gray-100' : ''
                                                                    }`}
                                                            >
                                                                <Pressable onPress={() => toggleParticipant(p.userId)}>
                                                                    <HStack className="items-center" space="sm">
                                                                        <Box
                                                                            className="w-6 h-6 rounded-md items-center justify-center"
                                                                            style={{
                                                                                backgroundColor: p.selected ? '#7C3AED' : '#FFFFFF',
                                                                                borderWidth: p.selected ? 0 : 2,
                                                                                borderColor: '#E5E7EB',
                                                                            }}
                                                                        >
                                                                            {p.selected && <Check size={14} color="#FFFFFF" />}
                                                                        </Box>
                                                                        <Avatar size="xs" style={{ backgroundColor: '#7C3AED' }}>
                                                                            <AvatarFallbackText>{p.displayName}</AvatarFallbackText>
                                                                        </Avatar>
                                                                        <Text className="text-gray-900">{p.displayName}</Text>
                                                                    </HStack>
                                                                </Pressable>

                                                                {p.selected && (
                                                                    <Box className="flex-row items-center">
                                                                        {splitEqually ? (
                                                                            <Text className="text-gray-600 font-medium">
                                                                                {p.amount.toLocaleString('vi-VN')}₫
                                                                            </Text>
                                                                        ) : (
                                                                            <HStack className="items-center">
                                                                                <TextInput
                                                                                    value={p.amount > 0 ? p.amount.toLocaleString('vi-VN') : ''}
                                                                                    onChangeText={val => updateParticipantAmount(p.userId, val)}
                                                                                    keyboardType="numeric"
                                                                                    placeholder="0"
                                                                                    className="text-right text-gray-900 font-medium w-24"
                                                                                    placeholderTextColor="#9CA3AF"
                                                                                />
                                                                                <Text className="text-gray-500 ml-1">₫</Text>
                                                                            </HStack>
                                                                        )}
                                                                    </Box>
                                                                )}
                                                            </HStack>
                                                        ))}
                                                    </Box>
                                                </VStack>
                                            </>
                                        )}
                                    </VStack>
                                )}

                                {error && (
                                    <Text style={{ color: '#EF4444' }} className="text-center">{error}</Text>
                                )}

                                {parsedItems.length > 0 && (
                                    <Button
                                        size="xl"
                                        onPress={handleCreateExpense}
                                        disabled={isCreating || !selectedGroupId}
                                        className="rounded-xl mb-8"
                                        style={{ backgroundColor: '#7C3AED' }}
                                    >
                                        {isCreating ? (
                                            <ButtonSpinner color="white" />
                                        ) : (
                                            <ButtonText className="font-semibold text-white">Thêm chi tiêu</ButtonText>
                                        )}
                                    </Button>
                                )}
                            </VStack>
                        )}
                    </VStack>
                </ScrollView>
            </SafeAreaView>
        </>
    );
}
