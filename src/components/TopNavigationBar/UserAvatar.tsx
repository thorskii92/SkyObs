import {
    AlertDialog,
    AlertDialogBackdrop,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarBadge, AvatarFallbackText } from "@/components/ui/avatar";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import {
    Popover,
    PopoverBackdrop,
    PopoverBody,
    PopoverContent
} from "@/components/ui/popover";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useOnlineStatus } from "@/src/context/IsOnlineContext";
import { useUser } from "@/src/context/UserContext";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useState } from "react";

export default function UserAvatar() {
    const db = useSQLiteContext(); // needed only for logout
    const router = useRouter();

    const { user, logout } = useUser();

    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [isLogoutOpen, setIsLogoutOpen] = useState(false);
    const { isOnline } = useOnlineStatus();

    const handleLogout = async () => {
        await logout(db);
        setIsLogoutOpen(false);
        setIsPopoverOpen(false);
        router.replace("/");
    };

    if (!user) return null;

    return (
        <>
            {/* Avatar + Popover */}
            <Popover
                isOpen={isPopoverOpen}
                onClose={() => setIsPopoverOpen(false)}
                placement="bottom right"
                trigger={(triggerProps) => (
                    <Pressable
                        {...triggerProps}
                        onPress={() => setIsPopoverOpen(true)}
                    >
                        <Avatar size="sm" className="bg-blue-950">
                            {user ? (
                                <AvatarFallbackText>
                                    {user.username?.charAt(0)}
                                </AvatarFallbackText>
                            ) : (
                                <AvatarFallbackText>?</AvatarFallbackText>
                            )}
                            <AvatarBadge className={isOnline ? "bg-green-500" : "bg-gray-400"} />
                        </Avatar>
                    </Pressable>
                )}
            >
                <PopoverBackdrop />
                <PopoverContent className="rounded-none">
                    <PopoverBody className="max-w-40">
                        <VStack space="md" className="w-full">

                            {/* User Info Section */}
                            <Box className="pb-3 border-b border-gray-200">

                                {/* Name */}
                                <Heading
                                    size="sm"
                                    className="truncate w-full"
                                    numberOfLines={1}
                                >
                                    {user?.fullName || user?.username}
                                </Heading>

                                {user?.fullName && (
                                    <Text size="xs" className="text-gray-500">
                                        @{user?.username}
                                    </Text>
                                )}

                                <Text size="xs" className={`mt-1 ${isOnline ? "text-green-600" : "text-gray-500"
                                    }`}>
                                    ● {isOnline ? "Online" : "Offline"}
                                </Text>

                                {/* Role + Status */}
                                <Text size="xs" className="text-gray-500 mt-2 mb-1">
                                    {user?.userType || "USER"} •{" "}
                                    <Text size="xs"
                                        className={
                                            user?.status === "ACTIVE"
                                                ? "text-green-600"
                                                : "text-red-500"
                                        }
                                    >
                                        {user?.status || "UNKNOWN"}
                                    </Text>
                                </Text>

                                {/* Station */}
                                <Text size="xs" className="text-gray-500">
                                    {user?.station_name || "No station assigned"}
                                </Text>

                            </Box>

                            {/* Actions */}
                            <VStack space="sm" className="pt-2">

                                <Button
                                    variant="solid"
                                    action="secondary"
                                    size="sm"
                                    className="w-full"
                                    onPress={() => {
                                        setIsPopoverOpen(false);
                                        router.push("/settings");
                                    }}
                                >
                                    <ButtonText>Profile Settings</ButtonText>
                                </Button>

                                <Button
                                    action="negative"
                                    size="sm"
                                    className="w-full"
                                    onPress={() => {
                                        setIsPopoverOpen(false);
                                        setIsLogoutOpen(true);
                                    }}
                                >
                                    <ButtonText>Logout</ButtonText>
                                </Button>

                            </VStack>

                        </VStack>
                    </PopoverBody>
                </PopoverContent>
            </Popover>

            {/* Logout Confirmation Dialog */}
            <AlertDialog
                isOpen={isLogoutOpen}
                onClose={() => setIsLogoutOpen(false)}
            >
                <AlertDialogBackdrop />
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <Heading size="md">
                            Confirm Logout
                        </Heading>
                    </AlertDialogHeader>

                    <AlertDialogBody>
                        <Text>
                            Are you sure you want to logout?
                        </Text>
                    </AlertDialogBody>

                    <AlertDialogFooter>
                        <Button
                            variant="outline"
                            onPress={() => setIsLogoutOpen(false)}
                        >
                            <ButtonText>Cancel</ButtonText>
                        </Button>

                        <Button
                            action="negative"
                            onPress={handleLogout}
                        >
                            <ButtonText>Logout</ButtonText>
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}