import { Stack } from 'expo-router';

export default function KYCLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0a0e12' }, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
