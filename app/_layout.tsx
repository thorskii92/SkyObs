import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <GluestackUIProvider>
      <Stack screenOptions={{ headerShown: true, headerStyle: { backgroundColor: '#f9fafb' }, headerTintColor: '#333' }}>
        <Stack.Screen
          name="index"
          options={{
            title: "Home",
            headerBackVisible: false,
          }}
        />
        <Stack.Screen
          name="datetime"
          options={{
            headerTitle: "New Observation",
            headerBackButtonDisplayMode: "minimal"
          }}
        />
        <Stack.Screen
          name="data-collection1"
          options={{
            headerTitle: "Data Collection",
            headerBackButtonDisplayMode: "minimal",
          }}
        />
        <Stack.Screen
          name="data-collection2"
          options={{
            headerTitle: "Data Collection",
            headerBackButtonDisplayMode: "minimal",
          }}
        />
      </Stack>
    </GluestackUIProvider>
  );
}
