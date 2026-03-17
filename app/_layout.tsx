import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';
import { createTAerodrome, createTCategory, createTCodeParameter, createTCodeTemplate, createTPsychrometric, createTSmsLogs, createTSmsRecipients, createTStations, createTSynopData, seedTCategories, seedTCodeParametersIfEmpty, seedTCodeTemplatesIfEmpty, seedTPsychrometricIfEmpty, seedTStationsIfEmpty, seedTSynopDataIfEmpty, testTables } from '@/src/utils/db';
import { Stack } from "expo-router";
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { KeyboardProvider } from 'react-native-keyboard-controller';

export default function RootLayout() {
  return (
    <SQLiteProvider
      databaseName='plotsdb'
      onInit={async (db) => {
        // if (__DEV__) await clearDatabase(db);

        await createTStations(db);

        await createTCategory(db);

        await createTPsychrometric(db);
        await createTSynopData(db);
        await createTAerodrome(db);

        await createTCodeTemplate(db);
        await createTCodeParameter(db);

        await createTSmsRecipients(db);
        await createTSmsLogs(db);

        await seedTStationsIfEmpty(db);
        await seedTCategories(db);
        await seedTPsychrometricIfEmpty(db);
        await seedTSynopDataIfEmpty(db);
        await seedTCodeTemplatesIfEmpty(db);
        await seedTCodeParametersIfEmpty(db);

        if (__DEV__) await testTables(db);
      }}
    >
      <KeyboardProvider>
        <GluestackUIProvider>
          <StatusBar translucent={true} />
          <Stack screenOptions={{ headerShown: false }} />
        </GluestackUIProvider>
      </KeyboardProvider>
    </SQLiteProvider >

  );
}
