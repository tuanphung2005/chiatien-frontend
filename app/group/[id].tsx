import { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Spinner } from '@/components/ui/spinner';
import { Button, ButtonIcon } from '@/components/ui/button';
import { Avatar, AvatarFallbackText } from '@/components/ui/avatar';
import { ChevronLeft, Plus, Receipt } from 'lucide-react-native';
import { groupsApi, GroupDetail, Expense } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

function ExpenseItem({ expense, currentUserId }: { expense: Expense; currentUserId: string }) {
    const isPayer = expense.paidBy.id === currentUserId;
    const userShare = expense.participants.find(p => p.userId === currentUserId);
    const displayAmount = isPayer ? expense.amount : userShare?.amount || 0;

    return (
        <Box className="bg-white rounded-xl p-4" style={{ shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 }}>
            <HStack className="justify-between items-start">
                <VStack className="flex-1" space="xs">
                    <Text className="text-gray-900 font-medium">{expense.description}</Text>
                    <Text className="text-gray-500 text-sm">
                        {expense.paidBy.displayName} đã trả • {new Date(expense.date).toLocaleDateString('vi-VN')}
                    </Text>
                </VStack>
                <VStack className="items-end">
                    <Text className="font-bold" style={{ color: isPayer ? '#10B981' : '#EF4444' }}>
                        {isPayer ? '+' : '-'}{displayAmount.toLocaleString('vi-VN')}₫
                    </Text>
                    <Text className="text-gray-400 text-xs">
                        Tổng: {expense.amount.toLocaleString('vi-VN')}₫
                    </Text>
                </VStack>
            </HStack>
        </Box>
    );
}

function MemberBalance({ member }: { member: { id: string; displayName: string; balance: number } }) {
    const isPositive = member.balance >= 0;

    return (
        <HStack className="items-center justify-between py-2">
            <HStack className="items-center" space="sm">
                <Avatar size="sm" style={{ backgroundColor: '#7C3AED' }}>
                    <AvatarFallbackText>{member.displayName}</AvatarFallbackText>
                </Avatar>
                <Text className="text-gray-900">{member.displayName}</Text>
            </HStack>
            <Text className="font-semibold" style={{ color: isPositive ? '#10B981' : '#EF4444' }}>
                {isPositive ? '+' : ''}{member.balance.toLocaleString('vi-VN')}₫
            </Text>
        </HStack>
    );
}

export default function GroupDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [group, setGroup] = useState<GroupDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const { user } = useAuth();
    const router = useRouter();

    const fetchGroup = useCallback(async () => {
        if (!id) return;
        try {
            const data = await groupsApi.get(id);
            setGroup(data);
        } catch (error) {
            console.error('Error fetching group:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [id]);

    useEffect(() => {
        fetchGroup();
    }, [fetchGroup]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchGroup();
    }, [fetchGroup]);

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#F9FAFB' }}>
                <Spinner size="large" />
            </View>
        );
    }

    if (!group) {
        return (
            <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#F9FAFB' }}>
                <Text style={{ color: '#EF4444' }}>Không tìm thấy nhóm</Text>
            </View>
        );
    }

    const userBalance = group.members.find(m => m.id === user?.id)?.balance || 0;

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
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: 100 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    {/* Header */}
                    <VStack className="items-center pt-12 pb-6 px-6" space="md">
                        <Text className="text-5xl">{group.emoji}</Text>
                        <Heading size="2xl" className="text-gray-900 text-center">
                            {group.name}
                        </Heading>
                        {group.description && (
                            <Text className="text-gray-500 text-center">{group.description}</Text>
                        )}
                        <Box className="rounded-xl px-6 py-3 mt-2" style={{ backgroundColor: '#EDE9FE' }}>
                            <VStack className="items-center">
                                <Text className="text-gray-600 text-sm">Số dư của bạn</Text>
                                <Text className="text-2xl font-bold" style={{ color: userBalance >= 0 ? '#10B981' : '#EF4444' }}>
                                    {userBalance >= 0 ? '+' : ''}{userBalance.toLocaleString('vi-VN')}₫
                                </Text>
                            </VStack>
                        </Box>
                    </VStack>

                    {/* Members */}
                    <VStack className="px-6 mb-6" space="sm">
                        <Heading size="md" className="text-gray-900">
                            Thành viên ({group.members.length})
                        </Heading>
                        <Box className="bg-white rounded-xl p-4" style={{ shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 }}>
                            {group.members.map((member) => (
                                <MemberBalance key={member.id} member={{ ...member, balance: member.balance || 0 }} />
                            ))}
                        </Box>
                    </VStack>

                    {/* Expenses */}
                    <VStack className="px-6" space="sm">
                        <HStack className="justify-between items-center">
                            <Heading size="md" className="text-gray-900">
                                Chi tiêu ({group.expenses.length})
                            </Heading>
                            <Text className="text-gray-500">
                                Tổng: {group.totalExpenses.toLocaleString('vi-VN')}₫
                            </Text>
                        </HStack>

                        {group.expenses.length === 0 ? (
                            <Box className="bg-white rounded-xl p-8 items-center" style={{ shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 }}>
                                <Receipt size={40} color="#9CA3AF" />
                                <Text className="text-gray-500 mt-3 text-center">
                                    Chưa có chi tiêu nào.{'\n'}Thêm chi tiêu đầu tiên!
                                </Text>
                            </Box>
                        ) : (
                            <VStack space="sm">
                                {group.expenses.map((expense) => (
                                    <ExpenseItem key={expense.id} expense={expense} currentUserId={user?.id || ''} />
                                ))}
                            </VStack>
                        )}
                    </VStack>
                </ScrollView>

                {/* FAB */}
                <View className="absolute bottom-6 right-6">
                    <Button
                        size="lg"
                        className="rounded-full w-14 h-14"
                        style={{ backgroundColor: '#7C3AED' }}
                        onPress={() => router.push(`/expense/add?groupId=${id}` as any)}
                    >
                        <ButtonIcon as={Plus} className="text-white" />
                    </Button>
                </View>
            </SafeAreaView>
        </>
    );
}
