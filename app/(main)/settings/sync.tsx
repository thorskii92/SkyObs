import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { getSynopData } from "@/src/utils/api";
import { getDB, upsertSynopData } from "@/src/utils/db";
import { formatDate } from "@/src/utils/formatters";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useState } from "react";
import { ActivityIndicator, Alert, RefreshControl } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DataSyncScreen() {
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [endDate, setEndDate] = useState<Date>(new Date());
    const [isSyncing, setIsSyncing] = useState(false);

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

    const handleSync = async () => {
        setIsSyncing(true);
        const db = await getDB();

        try {
            const start = formatDate(startDate);
            const end = formatDate(endDate);

            // 1️⃣ Fetch all synop data from server
            const response = await getSynopData({ startDate: start, endDate: end });
            const data = response.results;

            if (!data || data.length === 0) {
                Alert.alert("No Data", "No records found for the selected date range.");
                return;
            }

            // 2️⃣ Save each record into server/local DB
            for (const item of data) {
                await upsertSynopData(db, item);
            }

            Alert.alert(
                "Sync Complete",
                `Successfully synchronized ${data.length} records from ${start} to ${end}.`
            );
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
                    Select a date range to fetch server data and update the local database.
                </Text>

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

                <Pressable
                    onPress={handleSync}
                    className="bg-blue-500 py-3 rounded-xl items-center"
                    disabled={isSyncing}
                >
                    {isSyncing ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text className="text-white font-bold">Sync Data</Text>
                    )}
                </Pressable>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
}