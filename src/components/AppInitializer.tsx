import CustomSplash from '@/src/components/CustomSplash';
import * as SplashScreen from 'expo-splash-screen';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import {
    createTAerodrome,
    createTCategory,
    createTCodeParameter,
    createTCodeTemplate,
    createTPsychrometric,
    createTSmsLogs,
    createTSmsRecipients,
    createTStations,
    createTSynopData,
    createTUserConfig,
    seedTCategories,
    seedTCodeParametersIfEmpty,
    seedTCodeTemplatesIfEmpty,
    seedTStationsIfEmpty,
    seedTSynopDataIfEmpty,
    testTables
} from '@/src/utils/db';

// Prevent auto hide ASAP
SplashScreen.preventAutoHideAsync();

export default function AppInitializer({ children }: { children: React.ReactNode }) {
    const db = useSQLiteContext();
    const [ready, setReady] = useState(false);
    const [message, setMessage] = useState('Starting...');
    const [showWelcome, setShowWelcome] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                if (__DEV__) {
                    setMessage('Clearing database...');
                    // await clearDatabase(db);
                }

                setMessage('Creating tables...');
                await createTStations(db);
                await createTCategory(db);
                await createTPsychrometric(db);
                await createTSynopData(db);
                await createTAerodrome(db);
                await createTCodeTemplate(db);
                await createTCodeParameter(db);
                await createTSmsRecipients(db);
                await createTSmsLogs(db);
                await createTUserConfig(db);

                setMessage('Seeding stations...');
                await seedTStationsIfEmpty(db);

                setMessage('Seeding categories...');
                await seedTCategories(db);

                setMessage('Seeding synop...');
                await seedTSynopDataIfEmpty(db);

                setMessage('Seeding templates...');
                await seedTCodeTemplatesIfEmpty(db);

                setMessage('Seeding parameters...');
                await seedTCodeParametersIfEmpty(db);

                if (__DEV__) {
                    setMessage('Checking local database...');
                    await testTables(db);
                }

                setMessage('Almost ready...');

                // Show welcome message
                setShowWelcome(true);
                setMessage('Welcome to SkyObs :)');

                setTimeout(() => {
                    setReady(true);
                }, 1000);
            } catch (e) {
                console.error('DB init failed:', e);
            }
        };

        init();
    }, [db]);

    useEffect(() => {
        if (ready) {
            SplashScreen.hideAsync();
        }
    }, [ready]);

    if (!ready) {
        return <CustomSplash message={message} />;
    }


    return <>{children}</>;
}