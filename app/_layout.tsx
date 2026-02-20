import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';
import { createTCodeParameter, createTCodeTemplate, createTPsychrometric, createTSmsLogs, createTSmsRecipients, createTStations, createTSynopData, seedTStationsIfEmpty, seedTSynopDataIfEmpty, testTables } from '@/src/utils/db';
import { Stack } from "expo-router";
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { KeyboardProvider } from 'react-native-keyboard-controller';

export default function RootLayout() {
  return (
    <SQLiteProvider
      databaseName='plotsdb'
      onInit={async (db) => {
        await createTStations(db);
        await createTPsychrometric(db);
        await createTSynopData(db);

        await createTCodeTemplate(db);
        await createTCodeParameter(db);

        await createTSmsRecipients(db);
        await createTSmsLogs(db);

        await seedTStationsIfEmpty(db);
        await seedTSynopDataIfEmpty(db);

        await testTables(db);
      }}
    >
      <KeyboardProvider>
        <GluestackUIProvider>
          <StatusBar
            hidden={true}
          />
          <Stack screenOptions={{ headerShown: true, headerStyle: { backgroundColor: '#f9fafb' }, headerTintColor: '#333' }}>
            <Stack.Screen
              name="index"
              options={{
                title: "Home",
                headerBackVisible: false,
                headerShown: false,

              }}
            />
            <Stack.Screen
              name="datetime"
              options={{
                headerTitle: "New Observation",
                headerBackButtonDisplayMode: "minimal",
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="data-collection"
              options={{
                headerTitle: "Data Collection",
                headerBackButtonDisplayMode: "minimal",
                headerShown: false,
              }}
            />
          </Stack>
        </GluestackUIProvider>
      </KeyboardProvider>
    </SQLiteProvider >

  );
}
