import { Tabs } from 'expo-router';
import { View, Pressable } from 'react-native';
import { Home, Plus, Images } from 'lucide-react-native';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#7C3AED',
                tabBarInactiveTintColor: '#9CA3AF',
                tabBarStyle: {
                    backgroundColor: '#FFFFFF',
                    borderTopColor: '#F3F4F6',
                    borderTopWidth: 1,
                    paddingTop: 8,
                    paddingBottom: 8,
                    height: 70,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '500',
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Trang chủ',
                    tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="add"
                options={{
                    title: '',
                    tabBarLabel: () => null,
                    tabBarButton: (props) => (
                        <Pressable
                            {...props}
                            style={{
                                flex: 1,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <View
                                style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 28,
                                    backgroundColor: '#7C3AED',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginTop: -20,
                                    shadowColor: '#7C3AED',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.4,
                                    shadowRadius: 8,
                                    elevation: 8,
                                }}
                            >
                                <Plus size={28} color="#FFFFFF" strokeWidth={2.5} />
                            </View>
                        </Pressable>
                    ),
                }}
            />
            <Tabs.Screen
                name="stories"
                options={{
                    title: 'Xem lại',
                    tabBarIcon: ({ color, size }) => <Images size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="activity"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}
