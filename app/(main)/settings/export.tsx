import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { exportAllDataToCsv, getDB } from "@/src/utils/db";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import { ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ExportSettingsScreen() {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);

        try {
            const db = await getDB();
            const { fileUri, fileName } = await exportAllDataToCsv(db);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri, {
                    mimeType: "text/csv",
                    dialogTitle: "Export SkyObs Data",
                    UTI: "public.comma-separated-values-text",
                });
            } else {
                Alert.alert(
                    "Export Complete",
                    `CSV export saved to:\n${fileUri}`
                );
            }
        } catch (error) {
            console.error("Export failed:", error);
            Alert.alert(
                "Export Failed",
                "Unable to export app data into CSV. Please try again."
            );
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={{ top: 'off', bottom: 'off' }}>
            <Box className="flex-1 p-4">
                <VStack space="lg">
                    <Heading>Export All Data</Heading>
                    <Text className="text-gray-600">
                        Export your local SkyObs data into a CSV file. This will include stations, categories, SYNOP, aerodrome, templates, parameters, SMS recipients, and SMS logs.
                    </Text>

                    <Box className="bg-white rounded-2xl border border-gray-200 p-4">
                        <Text className="text-gray-700 mb-4">
                            When you export, a CSV file is generated and saved locally. You can then share or open it from your device.
                        </Text>

                        <Pressable
                            onPress={handleExport}
                            className="bg-blue-700 rounded-xl py-3 items-center"
                            disabled={isExporting}
                        >
                            {isExporting ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <Text className="text-white font-semibold">Export Data to CSV</Text>
                            )}
                        </Pressable>
                    </Box>
                </VStack>
            </Box>
        </SafeAreaView>
    );
}
