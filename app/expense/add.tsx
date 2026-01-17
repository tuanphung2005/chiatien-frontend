import { useLocalSearchParams, Redirect } from 'expo-router';

// Redirect to manual expense screen with groupId
export default function AddExpenseScreen() {
    const { groupId } = useLocalSearchParams<{ groupId?: string }>();
    return <Redirect href={`/expense/manual?groupId=${groupId}`} />;
}
