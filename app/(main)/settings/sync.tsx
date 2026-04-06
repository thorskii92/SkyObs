import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import {
    getAerodromeData,
    getCategories,
    getCodeParameters,
    getCodeTemplates,
    getPsychrometricData,
    getSmsRecipientsAPI,
    getStations,
    getSynopData,
    saveAerodromeData,
    saveCodeParameter,
    saveCodeTemplate,
    savePsychrometricData,
    saveSynopData,
    upsertSmsRecipientAPI,
} from "@/src/utils/api";
import {
    getDB,
    getLAerodromeData,
    getLSmsRecipients,
    getLSynopData,
    upsertAerodromeData,
    upsertStations,
    upsertSynopData
} from "@/src/utils/db";
import { formatDate } from "@/src/utils/formatters";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, BackHandler, RefreshControl } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

// Convert anything to MySQL DATE
const toDbDate = (input: string | Date) => {
    const d = new Date(input);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Convert anything to MySQL DATETIME
const toDbDatetime = (input: string | Date) => {
    const d = new Date(input);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ` +
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
};

export default function DataSyncScreen() {
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [endDate, setEndDate] = useState<Date>(new Date());
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncType, setSyncType] = useState<'GET' | 'POST'>('GET');

    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (isSyncing) {
                Alert.alert(
                    "Sync in Progress",
                    "Please wait for the sync to complete before navigating away.",
                    [{ text: "OK" }]
                );
                return true; // Prevent back navigation
            }
            return false; // Allow back navigation
        });

        return () => backHandler.remove();
    }, [isSyncing]);

    const showDatePicker = (mode: "start" | "end") => {
        const now = new Date();

        DateTimePickerAndroid.open({
            value: mode === "start" ? startDate : endDate,
            maximumDate: now,
            onChange: (event, selectedDate) => {
                if (!selectedDate) return;
                if (mode === "start") setStartDate(selectedDate);
                else setEndDate(selectedDate);
            },
            mode: "date",
            is24Hour: true,
        });
    };

    const syncSynopData = async (direction: 'GET' | 'POST') => {
        const db = await getDB();
        const start = toDbDate(startDate); // "YYYY-MM-DD"
        const end = toDbDate(endDate);     // "YYYY-MM-DD"

        if (direction === 'GET') {
            const response = await getSynopData({ startDate: start, endDate: end });
            const data = response.results;

            if (!data || data.length === 0) {
                Alert.alert("No Data", "No SYNOP records found for the selected date range.");
                return 0;
            }

            for (const item of data) {
                await upsertSynopData(db, item);
            }
            return data.length;
        } else {
            const localData = await getLSynopData(db, undefined, undefined, undefined, 'sDate', 'ASC');

            // Filter using normalized YYYY-MM-DD strings
            const filteredData = localData.filter((item: any) => {
                const itemDate = toDbDate(item.sDate);
                return itemDate >= start && itemDate <= end;
            });

            if (filteredData.length === 0) {
                Alert.alert("No Data", "No local SYNOP records found for the selected date range.");
                return 0;
            }

            let successCount = 0;
            for (const item of filteredData) {
                try {
                    const payload = {
                        ...item,
                        sDate: toDbDate(item.sDate), // only date part
                        sActualDateTime: item.sActualDateTime ? toDbDatetime(item.sActualDateTime) : null,
                        summaryDate: item.summaryDate ? toDbDate(item.summaryDate) : null
                    };
                    console.log("Posting SYNOP item:", payload);
                    await saveSynopData(payload);
                    successCount++;
                } catch (error) {
                    console.error("Failed to POST SYNOP data:", error);
                }
            }
            return successCount;
        }
    };

    const syncAerodromeData = async (direction: 'GET' | 'POST') => {
        const db = await getDB();
        const start = toDbDate(startDate); // "YYYY-MM-DD"
        const end = toDbDate(endDate);     // "YYYY-MM-DD"

        if (direction === 'GET') {
            const response = await getAerodromeData({ startDate: start, endDate: end });
            const data = response.results;

            if (!data || data.length === 0) {
                Alert.alert("No Data", "No Aerodrome records found for the selected date range.");
                return 0;
            }

            for (const item of data) {
                await upsertAerodromeData(db, item);
            }
            return data.length;
        } else {
            const localData = await getLAerodromeData(db, undefined, undefined, undefined, undefined, 'ASC');
            console.log("Local Aerodrome data count before filtering:", localData.length);

            // Filter using normalized YYYY-MM-DD strings to match MySQL DATE
            const filteredData = localData.filter((item: any) => {
                const itemDate = toDbDate(item.sDate); // normalize
                return itemDate >= start && itemDate <= end;
            });

            if (filteredData.length === 0) {
                Alert.alert("No Data", "No local Aerodrome records found for the selected date range.", [{ text: `Found ${localData.length} records in total.` }]);
                return 0;
            }

            let successCount = 0;
            for (const item of filteredData) {
                try {
                    // Normalize dates for MySQL
                    const payload = {
                        ...item,
                        sDate: toDbDate(item.sDate), // only date part
                        date_created: item.date_created ? toDbDatetime(item.date_created) : toDbDatetime(new Date()),
                        date_updated: item.date_updated ? toDbDatetime(item.date_updated) : toDbDatetime(new Date()),
                    };
                    console.log("Posting Aerodrome item:", payload);
                    await saveAerodromeData(payload);
                    successCount++;
                } catch (error) {
                    console.error("Failed to POST Aerodrome data:", error);
                }
            }
            return successCount;
        }
    };

    const syncStations = async () => {
        const db = await getDB();

        // Fetch from server and save to local
        const stations = await getStations();
        if (!stations || stations.length === 0) {
            Alert.alert("No Data", "No stations found.");
            return 0;
        }

        await upsertStations(db, stations);
        return stations.length;
    };

    const syncCategories = async () => {
        const db = await getDB();

        // Fetch from server and save to local (GET only)
        const categories = await getCategories();
        if (!categories || categories.length === 0) {
            Alert.alert("No Data", "No categories found.");
            return 0;
        }

        for (const category of categories) {
            await db.runAsync(
                `INSERT OR REPLACE INTO category (cID, cName, dateadded, dateupdated) VALUES (?, ?, ?, ?)`,
                [category.cID, category.cName, category.dateadded || new Date().toISOString(), category.dateupdated]
            );
        }
        return categories.length;
    };

    const syncCodeTemplates = async (direction: 'GET' | 'POST') => {
        const db = await getDB();

        if (direction === 'GET') {
            // Fetch from server and save to local
            const response = await getCodeTemplates();
            const data = response.results;

            if (!data || data.length === 0) {
                Alert.alert("No Data", "No code templates found.");
                return 0;
            }

            for (const item of data) {
                await db.runAsync(
                    `INSERT OR REPLACE INTO codetemplate (stnID, cID, hour, uID, Template, tType, dateadded, dateupdated) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [item.stnID, item.cID, item.hour, item.uID, item.Template, item.tType, item.dateadded || new Date().toISOString(), item.dateupdated]
                );
            }
            return data.length;
        } else {
            // POST local data to server
            const localData = await db.getAllAsync(
                `SELECT * FROM codetemplate`
            );

            if (!localData || localData.length === 0) {
                Alert.alert("No Data", "No local code templates found.");
                return 0;
            }

            let successCount = 0;
            for (const item of localData) {
                try {
                    await saveCodeTemplate(item);
                    successCount++;
                } catch (error) {
                    console.error("Failed to POST code template:", error);
                }
            }
            return successCount;
        }
    };

    const syncCodeParameters = async (direction: 'GET' | 'POST') => {
        const db = await getDB();

        if (direction === 'GET') {
            // Fetch from server and save to local
            const response = await getCodeParameters();
            const data = response.results;

            if (!data || data.length === 0) {
                Alert.alert("No Data", "No code parameters found.");
                return 0;
            }

            for (const item of data) {
                await db.runAsync(
                    `INSERT OR REPLACE INTO codeparameter (stnID, uID, cID, varname, var, par, dateadded, dateupdated) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [item.stnID, item.uID, item.cID, item.varname, item.var, item.par, item.dateadded || new Date().toISOString(), item.dateupdated]
                );
            }
            return data.length;
        } else {
            // POST local data to server
            const localData = await db.getAllAsync(
                `SELECT * FROM codeparameter`
            );

            if (!localData || localData.length === 0) {
                Alert.alert("No Data", "No local code parameters found.");
                return 0;
            }

            let successCount = 0;
            for (const item of localData) {
                try {
                    await saveCodeParameter(item);
                    successCount++;
                } catch (error) {
                    console.error("Failed to POST code parameter:", error);
                }
            }
            return successCount;
        }
    };

    const syncSmsRecipients = async (direction: 'GET' | 'POST') => {
        const db = await getDB();

        if (direction === 'GET') {
            // Fetch from server and save to local
            const recipients = await getSmsRecipientsAPI();

            if (!recipients || recipients.length === 0) {
                Alert.alert("No Data", "No SMS recipients found.");
                return 0;
            }

            for (const item of recipients) {
                await db.runAsync(
                    `INSERT OR REPLACE INTO sms_recipients (recipId, stnId, uId, cID, num, name, date_added, date_updated) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [item.recipId, item.stnId, item.uId, item.cID, item.num, item.name, item.date_added || new Date().toISOString(), item.date_updated]
                );
            }
            return recipients.length;
        } else {
            // POST local data to server
            const localData = await getLSmsRecipients(db);

            if (!localData || localData.length === 0) {
                Alert.alert("No Data", "No local SMS recipients found.");
                return 0;
            }

            let successCount = 0;
            for (const item of localData) {
                try {
                    await upsertSmsRecipientAPI({
                        stnId: item.stnId,
                        uId: item.uId,
                        cID: item.cID,
                        num: item.num,
                        name: item.name,
                    });
                    successCount++;
                } catch (error) {
                    console.error("Failed to POST SMS recipient:", error);
                }
            }
            return successCount;
        }
    };

    const syncPsychrometricData = async (direction: 'GET' | 'POST') => {
        const db = await getDB();

        if (direction === 'GET') {
            // Fetch from server and save to local
            const response = await getPsychrometricData();
            const data = response.results;

            for (const item of data) {
                await db.runAsync(
                    `INSERT OR REPLACE INTO psychrometric (dBulb, wBulb, dPoint, RH, vPressure) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [item.dBulb, item.wBulb, item.dPoint, item.RH, item.vPressure]
                );
            }
            return data.length;
        } else {
            // POST local data to server
            const localData = await db.getAllAsync(
                `SELECT * FROM psychrometric`
            );

            if (!localData || localData.length === 0) {
                Alert.alert("No Data", "No local psychrometric data found.");
                return 0;
            }

            let successCount = 0;
            for (const item of localData) {
                try {
                    await savePsychrometricData(item);
                    successCount++;
                } catch (error) {
                    console.error("Failed to POST psychrometric data:", error);
                }
            }
            return successCount;
        }
    };

    const handleSync = async () => {
        setIsSyncing(true);

        try {
            let totalRecords = 0;

            if (syncType === 'GET') {
                // GET operations - download and sync all data
                const synopCount = await syncSynopData('GET');
                const aerodromeCount = await syncAerodromeData('GET');
                const stationCount = await syncStations();
                const categoryCount = await syncCategories();
                const templateCount = await syncCodeTemplates('GET');
                const parameterCount = await syncCodeParameters('GET');
                const recipientCount = await syncSmsRecipients('GET');
                const psychCount = await syncPsychrometricData('GET');

                totalRecords = synopCount + aerodromeCount + stationCount + categoryCount + templateCount + parameterCount + recipientCount + psychCount;

                Alert.alert(
                    "Sync Complete",
                    `Downloaded:\n${synopCount} SYNOP\n${aerodromeCount} Aerodrome\n${stationCount} Station\n${categoryCount} Category\n${templateCount} Template\n${parameterCount} Parameter\n${recipientCount} Recipient\n${psychCount} Psychrometric records`
                );
            } else {
                // POST operations - upload local data
                const synopCount = await syncSynopData('POST');
                const aerodromeCount = await syncAerodromeData('POST');
                const templateCount = await syncCodeTemplates('POST');
                const parameterCount = await syncCodeParameters('POST');
                const recipientCount = await syncSmsRecipients('POST');
                const psychCount = await syncPsychrometricData('POST');

                totalRecords = synopCount + aerodromeCount + templateCount + parameterCount + recipientCount + psychCount;

                Alert.alert(
                    "Upload Complete",
                    `Uploaded:\n${synopCount} SYNOP\n${aerodromeCount} Aerodrome\n${templateCount} Template\n${parameterCount} Parameter\n${recipientCount} Recipient\n${psychCount} Psychrometric records`
                );
            }
        } catch (err) {
            console.error("Error syncing data:", err);
            Alert.alert("Sync Failed", "An error occurred while synchronizing data.");
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={{ top: 'off', bottom: 'off' }}>
            <KeyboardAwareScrollView
                className="flex-1 p-4"
                refreshControl={
                    <RefreshControl refreshing={isSyncing} onRefresh={handleSync} />
                }
            >
                <Heading>Data Synchronization</Heading>
                <Text className="text-gray-600 mb-4">
                    Select sync direction and date range to synchronize data between local and server.
                </Text>

                {/* Info Box */}
                <Box className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <Text className="text-sm text-blue-900 font-semibold mb-2">Data Tables Synced:</Text>
                    <Text className="text-xs text-blue-800">• SYNOP Data (GET/POST)
                        • Aerodrome Data (GET/POST)
                        • Stations (GET)
                        • Categories (GET)
                        • Code Templates (GET/POST)
                        • Code Parameters (GET/POST)
                        • SMS Recipients (GET/POST)
                        • Psychrometric Data (GET/POST)</Text>
                </Box>

                {/* Sync Type Selector */}
                <Box className="flex flex-row justify-center gap-2 mb-4">
                    <Pressable
                        onPress={() => setSyncType('GET')}
                        className={`flex-1 py-2 rounded-xl items-center ${syncType === 'GET' ? 'bg-blue-500' : 'bg-gray-200'}`}
                    >
                        <Text className={syncType === 'GET' ? 'text-white' : 'text-gray-700'}>Download (GET)</Text>
                    </Pressable>
                    <Pressable
                        onPress={() => setSyncType('POST')}
                        className={`flex-1 py-2 rounded-xl items-center ${syncType === 'POST' ? 'bg-green-500' : 'bg-gray-200'}`}
                    >
                        <Text className={syncType === 'POST' ? 'text-white' : 'text-gray-700'}>Upload (POST)</Text>
                    </Pressable>
                </Box>

                {syncType === 'GET' && (
                    <Box className="flex flex-row justify-between gap-2 mb-4">
                        <Pressable
                            onPress={() => showDatePicker("start")}
                            className="flex-1 bg-gray-100 p-3 rounded-xl items-center"
                        >
                            <Text>Start: {formatDate(startDate)}</Text>
                        </Pressable>

                        <Pressable
                            onPress={() => showDatePicker("end")}
                            className="flex-1 bg-gray-100 p-3 rounded-xl items-center"
                        >
                            <Text>End: {formatDate(endDate)}</Text>
                        </Pressable>
                    </Box>
                )}

                {syncType === 'POST' && (
                    <Box className="flex flex-row justify-between gap-2 mb-4">
                        <Pressable
                            onPress={() => showDatePicker("start")}
                            className="flex-1 bg-gray-100 p-3 rounded-xl items-center"
                        >
                            <Text>Start: {formatDate(startDate)}</Text>
                        </Pressable>

                        <Pressable
                            onPress={() => showDatePicker("end")}
                            className="flex-1 bg-gray-100 p-3 rounded-xl items-center"
                        >
                            <Text>End: {formatDate(endDate)}</Text>
                        </Pressable>
                    </Box>
                )}

                <Pressable
                    onPress={handleSync}
                    className={`py-3 rounded-xl items-center ${syncType === 'GET' ? 'bg-blue-500' : 'bg-green-500'}`}
                    disabled={isSyncing}
                >
                    {isSyncing ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text className="text-white font-bold">
                            {syncType === 'GET' ? 'Download Data' : 'Upload Data'}
                        </Text>
                    )}
                </Pressable>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
}