import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';
import AppInitializer from '@/src/components/AppInitializer';
import { OnlineStatusProvider } from '@/src/context/IsOnlineContext';
import { UserProvider } from '@/src/context/UserContext';
import { Stack } from 'expo-router';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { KeyboardProvider } from 'react-native-keyboard-controller';

function AppProviders({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();

  return (
    <OnlineStatusProvider>
      <UserProvider db={db}>
        {children}
      </UserProvider>
    </OnlineStatusProvider>
  );
}

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="plotsdb">
      <AppInitializer>
        <KeyboardProvider>
          <GluestackUIProvider>
            <StatusBar translucent />
            <AppProviders>
              <Stack screenOptions={{ headerShown: false }} />
            </AppProviders>
          </GluestackUIProvider>
        </KeyboardProvider>
      </AppInitializer>
    </SQLiteProvider>
  );
}