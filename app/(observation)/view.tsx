import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

import { Text } from "@/components/ui/text";
import GlobalLoading from "@/src/components/GlobalLoading";
import DataView from "@/src/components/view/DataView";
import { getDB, getLObservedData } from "@/src/utils/db"; // your DB helper
import { SafeAreaView } from "react-native-safe-area-context";

export default function ViewDataScreen() {
    const params = useLocalSearchParams();

    const stationId = Array.isArray(params.stationId) ? params.stationId[0] : params.stationId ?? "";
    const date = Array.isArray(params.date) ? params.date[0] : params.date ?? "";
    const time = Array.isArray(params.time) ? params.time[0] : params.time ?? "";

    const [loading, setLoading] = useState(true);
    const [empty, setEmpty] = useState(false);
    const [observedData, setObservedData] = useState<any | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setEmpty(false);

            try {
                const db = await getDB();
                const results = await getLObservedData(db, stationId, time, date);

                if (!results || results.length === 0) {
                    setEmpty(true);
                    setObservedData(null);
                } else {
                    setObservedData(results[0]); // assuming results is an array of observations
                }

                console.log("Station ID:", stationId);
                console.log("Time:", time);
                console.log("Date:", date);
                console.log("Results:", results);
            } catch (error) {
                console.error("Failed to fetch synop data:", error);
                setEmpty(true);
                setObservedData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [stationId, date, time]);

    if (loading) {
        return <GlobalLoading />;
    }

    if (empty || !observedData) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center px-4">
                <Text className="text-gray-400 text-center">
                    No data available for the selected station, date, and hour.
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1" edges={{ bottom: "additive" }}>
            <DataView observedData={observedData} />
        </SafeAreaView>
    );
}