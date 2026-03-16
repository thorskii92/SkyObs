import { Box } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { useRouter } from "expo-router";
import { BookOpen, Home, MessageSquareCode, Plus, Settings } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BottomNavigationBar({ state, navigation }: any) {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const tabs = [
        { name: "index", label: "Home", icon: Home },
        { name: "sms-history", label: "SMS History", icon: MessageSquareCode },
        { name: "collect", label: "Collect", icon: Plus }, // center FAB
        { name: "manual", label: "Manual", icon: BookOpen },
        { name: "settings", label: "Settings", icon: Settings },
    ];

    const tabPaths: Record<string, string> = {
        index: "/(main)/",
        "sms-history": "/(main)/sms-history",
        manual: "/(main)/manual",
        settings: "/(main)/settings",
    };

    const renderTab = (tab: any, index: number) => {
        const isFAB = tab.name === "collect";
        const isFocused = state.index === state.routes.findIndex((r: any) => r.name === tab.name);

        if (isFAB) {
            return (
                <Pressable
                    key={index}
                    onPress={() => router.push("/(observation)/options")}
                    className="bg-blue-400 rounded-full p-4 shadow-xl"
                    style={{ marginTop: -30 }}
                >
                    <Plus color="white" size={30} />
                </Pressable>
            );
        }

        return (
            <Pressable
                key={tab.name}
                onPress={() => router.push(tabPaths[tab.name])}
                className="flex-1 items-center py-2"
            >
                <Icon as={tab.icon} size="2xl" color={isFocused ? "#2563eb" : "#6b7280"}/>
                <Text className={`text-xs mt-1 ${isFocused ? "text-blue-600" : "text-gray-500"}`}>
                    {tab.label}
                </Text>
            </Pressable>
        );
    };

    return (
        <Box
            className="w-full bg-white border-t border-gray-200 flex-row justify-between items-center py-2 mb-2"
            style={{ paddingBottom: insets.bottom }}
        >
            {tabs.map(renderTab)}
        </Box>
    );
}