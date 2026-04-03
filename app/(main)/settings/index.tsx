import { Avatar, AvatarFallbackText } from "@/components/ui/avatar";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useUser } from "@/src/context/UserContext";
import { useRouter } from "expo-router";

export default function SettingsScreen() {
    const { user } = useUser();
    const router = useRouter();

    const menuItems = [
        {
            label: "User Settings",
            route: "/settings/user",
        },
        {
            label: "SMS Recipients",
            route: "/settings/sms-recipients",
        },
        {
            label: "Code Templates",
            route: "/settings/code-templates",
        },
        {
            label: "Data Synchronization",
            route: "/settings/sync",
        },
        {
            label: "About Developers",
            route: "/settings/developers",
        },
    ];

    return (
        <Box className="flex-1 bg-white px-4 pt-6">
            <VStack space="lg">

                {/* 👤 User Card / Sign In */}
                <Box className="bg-gray-100 rounded-2xl p-4">
                    {!user ? (
                        <VStack space="md" className="items-center">

                            <Heading size="sm">
                                You're not signed in
                            </Heading>

                            <Text size="sm" className="text-gray-500 text-center">
                                Sign in to sync data, manage settings, and access your account.
                            </Text>

                            <Pressable
                                onPress={() => router.push("/login")}
                                className="bg-blue-950 px-4 py-2 rounded-xl"
                            >
                                <Text className="text-white font-semibold">
                                    Sign In
                                </Text>
                            </Pressable>

                        </VStack>
                    ) : (
                        <VStack space="md" className="items-center">

                            <Avatar size="lg" className="bg-blue-950">
                                <AvatarFallbackText>
                                    {user?.fullName?.charAt(0) || "U"}
                                </AvatarFallbackText>
                            </Avatar>

                            <VStack space="xs" className="items-center">
                                <Heading size="md">
                                    {user?.fullName || user?.username}
                                </Heading>

                                {user?.fullName && (
                                    <Text size="sm" className="text-gray-500">
                                        @{user?.username}
                                    </Text>
                                )}

                                <Text size="sm" className="text-gray-500">
                                    {user?.userType || "USER"} •{" "}
                                    <Text
                                        size="sm"
                                        className={
                                            user?.status === "ACTIVE"
                                                ? "text-green-600"
                                                : "text-red-500"
                                        }
                                    >
                                        {user?.status || "UNKNOWN"}
                                    </Text>
                                </Text>

                                <Text size="xs" className="text-gray-400">
                                    {user?.station_name || "No station assigned"}
                                </Text>
                            </VStack>

                        </VStack>
                    )}
                </Box>

                {/* ⚙️ Settings Options */}
                <Box className="bg-white rounded-2xl border border-gray-200">

                    {menuItems.map((item, index) => (
                        <Pressable
                            key={item.label}
                            onPress={() => {
                                // 🔒 Optional: protect routes
                                if (!user) {
                                    router.push("/login");
                                    return;
                                }

                                router.push(item.route);
                            }}
                            className={`px-4 py-4 ${index !== menuItems.length - 1
                                    ? "border-b border-gray-200"
                                    : ""
                                }`}
                        >
                            <Text size="md" className="text-gray-800">
                                {item.label}
                            </Text>
                        </Pressable>
                    ))}

                </Box>

            </VStack>
        </Box>
    );
}