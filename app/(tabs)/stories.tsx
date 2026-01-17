import { useEffect, useState, useCallback, useRef } from 'react';
import {
    View,
    RefreshControl,
    Pressable,
    Dimensions,
    FlatList,
    Image,
    ViewToken,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Spinner } from '@/components/ui/spinner';
import { Avatar, AvatarFallbackText } from '@/components/ui/avatar';
import { Receipt, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { expensesApi, groupsApi, Expense, Group } from '@/lib/api';

const { width, height } = Dimensions.get('window');
const SCREEN_HEIGHT = height;
const IMAGE_SIZE = width;

interface GroupWithExpenses {
    group: Group;
    expenses: Expense[];
}

interface ExpenseCardProps {
    expense: Expense;
    currentIndex: number;
    totalCount: number;
}

function ExpenseCard({ expense, currentIndex, totalCount }: ExpenseCardProps) {
    const hasImage = expense.receiptUrl && expense.receiptUrl.length > 0;

    return (
        <View style={{ width, height: SCREEN_HEIGHT - 150 }}>
            <Box className="flex-1" style={{ backgroundColor: '#F9FAFB' }}>
                <Box style={{ width: IMAGE_SIZE, height: IMAGE_SIZE }}>
                    {hasImage ? (
                        <Image
                            source={{ uri: expense.receiptUrl }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                        />
                    ) : (
                        <Box
                            className="flex-1 items-center justify-center"
                            style={{ backgroundColor: '#F3F4F6' }}
                        >
                            <Receipt size={80} color="#9CA3AF" />
                            <Text className="text-gray-400 mt-4 text-lg">Không có ảnh</Text>
                        </Box>
                    )}

                    {totalCount > 1 && (
                        <Box className="absolute top-4 right-4">
                            <Box
                                className="px-3 py-1.5 rounded-full"
                                style={{ backgroundColor: 'rgba(124,58,237,0.9)' }}
                            >
                                <Text className="text-white text-sm font-medium">
                                    {currentIndex + 1}/{totalCount}
                                </Text>
                            </Box>
                        </Box>
                    )}

                    <Box className="absolute top-4 left-4">
                        <Box
                            className="px-3 py-1.5 rounded-full"
                            style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}
                        >
                            <Text className="text-gray-800 text-sm font-medium">
                                {expense.group?.emoji} {expense.group?.name}
                            </Text>
                        </Box>
                    </Box>

                    {totalCount > 1 && currentIndex > 0 && (
                        <Box className="absolute left-3 top-1/2" style={{ marginTop: -20 }}>
                            <Box
                                className="w-10 h-10 rounded-full items-center justify-center"
                                style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
                            >
                                <ChevronLeft size={24} color="#7C3AED" />
                            </Box>
                        </Box>
                    )}

                    {totalCount > 1 && currentIndex < totalCount - 1 && (
                        <Box className="absolute right-3 top-1/2" style={{ marginTop: -20 }}>
                            <Box
                                className="w-10 h-10 rounded-full items-center justify-center"
                                style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
                            >
                                <ChevronRight size={24} color="#7C3AED" />
                            </Box>
                        </Box>
                    )}
                </Box>

                <VStack className="flex-1 px-5 py-4" style={{ backgroundColor: '#FFFFFF' }}>
                    <Text className="text-gray-900 text-3xl font-bold mb-2">
                        {expense.amount.toLocaleString('vi-VN')}₫
                    </Text>

                    <Text className="text-gray-600 text-lg mb-4" numberOfLines={2}>
                        {expense.description}
                    </Text>

                    <HStack className="items-center" space="sm">
                        <Avatar size="sm" style={{ backgroundColor: '#7C3AED' }}>
                            <AvatarFallbackText>{expense.paidBy.displayName}</AvatarFallbackText>
                        </Avatar>
                        <VStack>
                            <Text className="text-gray-900 font-medium">
                                {expense.paidBy.displayName}
                            </Text>
                            <Text className="text-gray-500 text-sm">đã trả</Text>
                        </VStack>
                        <Box className="flex-1" />
                        <Text className="text-gray-500">
                            {new Date(expense.date).toLocaleDateString('vi-VN')}
                        </Text>
                    </HStack>

                    {expense.participants && expense.participants.length > 0 && (
                        <VStack className="mt-4 pt-4 border-t border-gray-100">
                            <Text className="text-gray-500 text-sm mb-2">
                                Chia cho {expense.participants.length} người
                            </Text>
                            <HStack className="flex-wrap" space="xs">
                                {expense.participants.slice(0, 5).map((p, idx) => (
                                    <Box
                                        key={idx}
                                        className="px-3 py-1 rounded-full mb-1"
                                        style={{ backgroundColor: '#EDE9FE' }}
                                    >
                                        <Text className="text-gray-700 text-sm">
                                            {p.user.displayName}: {p.amount.toLocaleString('vi-VN')}₫
                                        </Text>
                                    </Box>
                                ))}
                                {expense.participants.length > 5 && (
                                    <Text className="text-gray-500 text-sm">
                                        +{expense.participants.length - 5} người khác
                                    </Text>
                                )}
                            </HStack>
                        </VStack>
                    )}
                </VStack>
            </Box>
        </View>
    );
}

function GroupRow({ groupData }: {
    groupData: GroupWithExpenses;
}) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0 && viewableItems[0].index !== null) {
            setCurrentIndex(viewableItems[0].index);
        }
    }, []);

    const viewabilityConfig = { itemVisiblePercentThreshold: 50 };

    if (groupData.expenses.length === 0) {
        return (
            <Box
                className="items-center justify-center"
                style={{ width, height: SCREEN_HEIGHT - 150, backgroundColor: '#F9FAFB' }}
            >
                <Text className="text-5xl mb-2">{groupData.group.emoji}</Text>
                <Text className="text-gray-900 text-lg font-semibold mb-4">
                    {groupData.group.name}
                </Text>
                <Receipt size={48} color="#9CA3AF" />
                <Text className="text-gray-400 mt-4">Chưa có chi tiêu</Text>
            </Box>
        );
    }

    return (
        <FlatList
            data={groupData.expenses}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            renderItem={({ item }) => (
                <ExpenseCard
                    expense={item}
                    currentIndex={currentIndex}
                    totalCount={groupData.expenses.length}
                />
            )}
        />
    );
}

export default function StoriesScreen() {
    const [groupsWithExpenses, setGroupsWithExpenses] = useState<GroupWithExpenses[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentGroupIndex, setCurrentGroupIndex] = useState(0);

    const { user } = useAuth();
    const router = useRouter();
    const mainListRef = useRef<FlatList>(null);

    const fetchData = useCallback(async () => {
        try {
            const [groups, expenses] = await Promise.all([
                groupsApi.list(),
                expensesApi.list(),
            ]);

            const grouped: GroupWithExpenses[] = groups.map(group => ({
                group,
                expenses: expenses.filter(e => e.group?.id === group.id),
            }));

            setGroupsWithExpenses(grouped);
        } catch (error) {
            console.error('error fetching data:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0 && viewableItems[0].index !== null) {
            setCurrentGroupIndex(viewableItems[0].index);
        }
    }, []);

    const viewabilityConfig = { itemVisiblePercentThreshold: 50 };

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#F9FAFB' }}>
                <Spinner size="large" />
            </View>
        );
    }

    if (groupsWithExpenses.length === 0) {
        return (
            <SafeAreaView className="flex-1" style={{ backgroundColor: '#F9FAFB' }}>
                <View className="flex-1 items-center justify-center px-6">
                    <Receipt size={64} color="#9CA3AF" />
                    <Text className="text-gray-500 text-center mt-4 text-lg">
                        Chưa có nhóm nào
                    </Text>
                    <Pressable
                        className="mt-6"
                        onPress={() => router.push('/(tabs)/add')}
                    >
                        <Box
                            className="px-6 py-3 rounded-full"
                            style={{ backgroundColor: '#7C3AED' }}
                        >
                            <Text className="text-white font-semibold">Tạo nhóm đầu tiên</Text>
                        </Box>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <View className="flex-1" style={{ backgroundColor: '#F9FAFB' }}>
            <SafeAreaView className="absolute top-0 left-0 right-0 z-10" edges={['top']}>
                <HStack
                    className="px-4 py-2 justify-between items-center"
                    style={{ backgroundColor: 'rgba(249,250,251,0.95)' }}
                >
                    <VStack>
                        <Text className="text-gray-500 text-xs">Xin chào</Text>
                        <Text className="text-gray-900 font-semibold">
                            {user?.displayName || 'Bạn'}
                        </Text>
                    </VStack>

                    <HStack className="items-center" space="xs">
                        {groupsWithExpenses.slice(0, 4).map((g, idx) => (
                            <Box
                                key={g.group.id}
                                className="w-2 h-2 rounded-full"
                                style={{
                                    backgroundColor: idx === currentGroupIndex
                                        ? '#7C3AED'
                                        : '#D1D5DB',
                                }}
                            />
                        ))}
                        {groupsWithExpenses.length > 4 && (
                            <Text className="text-gray-400 text-xs ml-1">
                                +{groupsWithExpenses.length - 4}
                            </Text>
                        )}
                    </HStack>

                    <Box
                        className="w-8 h-8 rounded-full items-center justify-center"
                        style={{ backgroundColor: '#7C3AED' }}
                    >
                        <Text className="text-white font-bold text-sm">
                            {(user?.displayName || 'U')[0].toUpperCase()}
                        </Text>
                    </Box>
                </HStack>
            </SafeAreaView>

            <FlatList
                ref={mainListRef}
                data={groupsWithExpenses}
                keyExtractor={(item) => item.group.id}
                pagingEnabled
                showsVerticalScrollIndicator={false}
                snapToInterval={SCREEN_HEIGHT - 150}
                decelerationRate="fast"
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#7C3AED"
                    />
                }
                contentContainerStyle={{ paddingTop: 70 }}
                renderItem={({ item }) => (
                    <GroupRow groupData={item} />
                )}
            />
        </View>
    );
}
