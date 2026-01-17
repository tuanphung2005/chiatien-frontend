import { useState, useEffect } from 'react';
import { Pressable, ScrollView, TextInput, Switch } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { Avatar, AvatarFallbackText } from '@/components/ui/avatar';
import { ChevronLeft, Check, ChevronDown } from 'lucide-react-native';
import { expensesApi, groupsApi, Group, GroupMember } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface ParticipantState {
    userId: string;
    displayName: string;
    selected: boolean;
    amount: number;
}

export default function ManualExpenseScreen() {
    const { groupId } = useLocalSearchParams<{ groupId?: string }>();
    const { user } = useAuth();
    const router = useRouter();

    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(groupId || null);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

    const [payerId, setPayerId] = useState<string>(user?.id || '');
    const [participants, setParticipants] = useState<ParticipantState[]>([]);
    const [splitEqually, setSplitEqually] = useState(true);
    const [showPayerPicker, setShowPayerPicker] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
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

    useEffect(() => {
        if (splitEqually && participants.length > 0) {
            recalculateEqualSplit();
        }
    }, [amount, splitEqually, participants.filter(p => p.selected).length]);

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

    function recalculateEqualSplit() {
        const numericAmount = getNumericAmount();
        const selectedCount = participants.filter(p => p.selected).length;
        if (selectedCount === 0) return;

        const perPerson = Math.round(numericAmount / selectedCount);
        setParticipants(prev => prev.map(p => ({
            ...p,
            amount: p.selected ? perPerson : 0,
        })));
    }

    function formatAmount(value: string) {
        const digits = value.replace(/\D/g, '');
        return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    function handleAmountChange(text: string) {
        setAmount(formatAmount(text));
    }

    function getNumericAmount(): number {
        return parseInt(amount.replace(/\./g, ''), 10) || 0;
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

    async function handleCreate() {
        if (!selectedGroupId) {
            setError('Vui lòng chọn nhóm');
            return;
        }

        const numericAmount = getNumericAmount();
        if (numericAmount <= 0) {
            setError('Vui lòng nhập số tiền');
            return;
        }

        if (!description.trim()) {
            setError('Vui lòng nhập mô tả');
            return;
        }

        const selectedParticipants = participants.filter(p => p.selected);
        if (selectedParticipants.length === 0) {
            setError('Vui lòng chọn ít nhất 1 người tham gia');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await expensesApi.create({
                groupId: selectedGroupId,
                amount: numericAmount,
                description: description.trim(),
                paidById: payerId,
                participants: selectedParticipants.map(p => ({
                    userId: p.userId,
                    amount: p.amount,
                })),
            });
            router.replace(`/group/${selectedGroupId}` as never);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Không thể tạo chi tiêu');
        } finally {
            setIsLoading(false);
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
                        <Heading size="2xl" className="text-gray-900">Thêm chi tiêu</Heading>

                        <VStack space="xs">
                            <Text className="text-gray-600 font-medium">Số tiền *</Text>
                            <Box className="bg-white border border-gray-200 rounded-xl px-4 py-4 flex-row items-center">
                                <TextInput
                                    value={amount}
                                    onChangeText={handleAmountChange}
                                    placeholder="0"
                                    keyboardType="numeric"
                                    className="flex-1 text-gray-900 text-3xl font-bold"
                                    placeholderTextColor="#9CA3AF"
                                />
                                <Text className="text-gray-500 text-xl">₫</Text>
                            </Box>
                        </VStack>

                        <VStack space="xs">
                            <Text className="text-gray-600 font-medium">Mô tả *</Text>
                            <Input variant="outline" size="xl" className="rounded-xl bg-white border-gray-200">
                                <InputField
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder="VD: Tiền điện, Ăn trưa..."
                                    className="text-gray-900"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </Input>
                        </VStack>

                        <VStack space="sm">
                            <Text className="text-gray-600 font-medium">Nhóm *</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <HStack space="sm">
                                    {groups.map(group => (
                                        <Pressable key={group.id} onPress={() => setSelectedGroupId(group.id)}>
                                            <Box
                                                className="px-4 py-3 rounded-xl"
                                                style={{
                                                    backgroundColor: selectedGroupId === group.id ? '#7C3AED' : '#FFFFFF',
                                                    borderWidth: 1,
                                                    borderColor: selectedGroupId === group.id ? '#7C3AED' : '#E5E7EB',
                                                }}
                                            >
                                                <Text
                                                    style={{ color: selectedGroupId === group.id ? 'white' : '#374151' }}
                                                    className="font-medium"
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
                                    <Text className="text-gray-600 font-medium">Người trả *</Text>
                                    <Pressable onPress={() => setShowPayerPicker(!showPayerPicker)}>
                                        <Box className="bg-white border border-gray-200 rounded-xl p-4 flex-row items-center justify-between">
                                            <HStack className="items-center" space="sm">
                                                <Avatar size="sm" style={{ backgroundColor: '#7C3AED' }}>
                                                    <AvatarFallbackText>{payer?.displayName || ''}</AvatarFallbackText>
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
                                                    <HStack
                                                        className="p-3 items-center justify-between border-b border-gray-100"
                                                    >
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
                                                className={`p-4 items-center justify-between ${idx < participants.length - 1 ? 'border-b border-gray-100' : ''}`}
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

                        {error && <Text style={{ color: '#EF4444' }} className="text-center">{error}</Text>}

                        <Button
                            size="xl"
                            onPress={handleCreate}
                            disabled={isLoading}
                            className="rounded-xl mt-4 mb-8"
                            style={{ backgroundColor: '#7C3AED' }}
                        >
                            {isLoading ? (
                                <ButtonSpinner color="white" />
                            ) : (
                                <ButtonText className="font-semibold text-white">
                                    Thêm chi tiêu ({amount || '0'}₫)
                                </ButtonText>
                            )}
                        </Button>
                    </VStack>
                </ScrollView>
            </SafeAreaView>
        </>
    );
}
