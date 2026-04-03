import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Image } from "@/components/ui/image";
import { Text } from "@/components/ui/text";
import { useOnlineStatus } from "@/src/context/IsOnlineContext";
import { useUser } from "@/src/context/UserContext";
import UserAvatar from "./UserAvatar";

export default function TopNavigationBar() {
    const { user } = useUser();
    const { isOnline } = useOnlineStatus();

    const stationName =
        user?.station_name || "No station assigned";

    const bgColor = isOnline ? "bg-green-600" : "bg-gray-400";
    const statusText = isOnline ? "ONLINE" : "OFFLINE";

    return (
        <>
            {/* Top Bar */}
            <Box className="flex flex-row items-center justify-between w-full bg-white px-4 pb-2 pt-12 shadow-lg">

                {/* Left: Logo + App Name */}
                <Box className="flex flex-row gap-2 items-center">
                    <Image
                        size="xs"
                        alt="Logo"
                        source={require("@/assets/images/skyobs-logo.jpg")}
                        className="rounded-2xl aspect-square overflow-hidden shadow-2xl"
                    />
                    <Heading>SkyObs</Heading>
                </Box>

                {/* Right: Actions */}
                <Box className="flex flex-row gap-4 items-center">
                    <UserAvatar />
                </Box>
            </Box>

            {/* Station + Status Bar */}
            <Box
                className={`${bgColor} px-3 py-1.5 shadow-2xl flex flex-row items-center justify-center gap-2`}
            >
                {user ? (
                    <>
                        {/* Station Name */}
                        <Text className="text-white text-2xs font-bold">
                            {stationName}
                        </Text>

                        {/* Separator */}
                        <Text className="text-white text-2xs">-</Text>
                    </>
                ) : null}

                {/* Status (always shown) */}
                <Text className="text-white text-2xs font-bold">
                    {statusText}
                </Text>
            </Box>
        </>
    );
}