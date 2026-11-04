import { Stack } from 'expo-router';
import { Providers } from '@/components/Providers';
import { useAuth } from '@/hooks/useAuth';

export default function RootLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Providers>
      <Stack>
        {isLoading ? (
          <Stack.Screen name="(auth)/loading" options={{ presentation: 'modal' }} />
        ) : isAuthenticated ? (
          <>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(collector)/profile" options={{ title: 'Profile' }} />
            <Stack.Screen name="(collector)/vehicle" options={{ title: 'Vehicle Details' }} />
            <Stack.Screen name="(collector)/earnings" options={{ title: 'Earnings' }} />
          </>
        ) : (
          <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        )}
      </Stack>
    </Providers>
  );
}
