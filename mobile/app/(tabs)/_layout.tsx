import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#d4a24c',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#0a0e12',
          borderTopColor: '#1e2530',
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerStyle: { backgroundColor: '#0a0e12' },
        headerTintColor: '#f5f0e8',
        headerTitleStyle: { fontWeight: '300', letterSpacing: 0.5 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} />,
          headerTitle: 'Coastal Corridor',
        }}
      />
      <Tabs.Screen
        name="properties"
        options={{
          title: 'Properties',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
        listeners={{
          // When the user taps the Properties tab icon directly, always reset
          // to the base route (no destinationId / destinationName params).
          // This prevents the tab from staying stuck on a destination-filtered
          // view after navigating here from the Explore screen.
          tabPress: (e) => {
            e.preventDefault();
            router.replace('/(tabs)/properties');
          },
        }}
      />
      <Tabs.Screen
        name="fractional"
        options={{
          title: 'Fractional',
          tabBarIcon: ({ color, size }) => <Ionicons name="pie-chart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
