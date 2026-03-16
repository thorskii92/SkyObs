import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";
import { Image } from "@/components/ui/image";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { Palette } from "lucide-react-native";
import UserAvatar from "./UserAvatar";

// TODO: need to implement AuthContext to pass DP & stnName
// TODO: need to implement NotificationContext for realtime updates
export default function TopNavigationBar() {
    return (
        <>
            <Box className="flex flex-row items-center justify-between w-full bg-white px-4 pb-2 pt-12 shadow-lg">
                <Box className="flex flex-row gap-2 items-center">
                    <Image size="xs" alt="Logo" source={require("@/assets/images/skyobs-logo.jpg")} className="rounded-2xl aspect-square overflow-hidden shadow-2xl" />
                    <Heading>SkyObs</Heading>
                </Box>
                <Box className="flex flex-row gap-4 items-center">
                    <Pressable>
                        <Icon as={Palette} size="xl" className="text-gray-500" />
                    </Pressable>
                    <UserAvatar />
                </Box>
            </Box>
            <Box className="bg-blue-400 p-1.5 shadow-2xl shadow-blue-600">
                <Text className="text-white text-2xs text-center font-medium">Puerto Princesa Complex Station</Text>
            </Box>
        </>
    );
}