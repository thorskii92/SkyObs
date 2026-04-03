import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import {
    Input,
    InputField,
    InputIcon,
    InputSlot
} from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { Toast, ToastTitle, useToast } from "@/components/ui/toast";
import { useUser } from "@/src/context/UserContext";
import { changeUserPassword } from "@/src/utils/api";
import { EyeIcon, EyeOffIcon } from "lucide-react-native";
import { useState } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

export default function UserSettingsScreen() {
    const { user, updateUser } = useUser();
    const toast = useToast();

    const [fullName, setFullName] = useState(user?.fullName || "");
    const [loading, setLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [error, setError] = useState("");

    const isDirty = fullName !== user?.fullName;

    const showToast = (title: string) => {
        toast.show({
            placement: "top",
            render: () => (
                <Toast>
                    <ToastTitle>{title}</ToastTitle>
                </Toast>
            )
        });
    };

    const getPasswordStrength = () => {
        if (newPassword.length < 6) return "Weak";
        if (newPassword.match(/^(?=.*[A-Z])(?=.*\d).+$/)) return "Strong";
        return "Medium";
    };

    const handleSave = async () => {
        if (!isDirty) return;

        setLoading(true);
        const success = await updateUser({ fullName });
        setLoading(false);

        showToast(success ? "Profile updated" : "Update failed");
    };

    const handleChangePassword = async () => {
        if (!user?.id) return;

        setError("");

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError("All password fields are required");
            return;
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            setPasswordLoading(true);

            const res = await changeUserPassword(
                user.id,
                currentPassword,
                newPassword
            );

            if (!res) {
                setError("Failed to change password");
                return;
            }

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

            showToast("Password changed successfully");

        } catch (err) {
            console.error(err);
            setError("Error changing password");
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <SafeAreaView edges={{ top: "off", bottom: "off" }}>
            <KeyboardAwareScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
            >
                <Box className="flex-1 bg-white px-4 py-4 gap-6">

                    {/* HEADER */}
                    <Box className="gap-2">
                        <Heading>Profile Settings</Heading>
                        <Text className="text-gray-600">
                            Manage your account information and password.
                        </Text>
                    </Box>

                    {/* PROFILE */}
                    <Box className="bg-gray-100 p-4 rounded-xl gap-4">

                        <Box className="gap-1">
                            <Text>Username</Text>
                            <Input isDisabled>
                                <InputField value={user?.username} />
                            </Input>
                        </Box>

                        <Box className="gap-1">
                            <Text>Full Name</Text>
                            <Input>
                                <InputField
                                    value={fullName}
                                    onChangeText={setFullName}
                                />
                            </Input>
                        </Box>

                        <Box className="gap-1">
                            <Text>User Type</Text>
                            <Input isDisabled>
                                <InputField value={user?.userType} />
                            </Input>
                        </Box>

                        <Box className="gap-1">
                            <Text>Status</Text>
                            <Input isDisabled>
                                <InputField value={user?.status} />
                            </Input>
                        </Box>

                    </Box>

                    <Button
                        onPress={handleSave}
                        isDisabled={!isDirty || loading}
                    >
                        <ButtonText>
                            {loading ? "Saving..." : "Save Changes"}
                        </ButtonText>
                    </Button>

                    {/* PASSWORD */}
                    <Box className="bg-gray-100 p-4 rounded-xl gap-4">

                        <Heading size="md">Change Password</Heading>

                        {/* Current */}
                        <Input>
                            <InputField
                                placeholder="Current Password"
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                secureTextEntry={!showCurrent}
                            />
                            <InputSlot onPress={() => setShowCurrent(!showCurrent)}>
                                <InputIcon as={showCurrent ? EyeOffIcon : EyeIcon} />
                            </InputSlot>
                        </Input>

                        {/* New */}
                        <Input>
                            <InputField
                                placeholder="New Password"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry={!showNew}
                            />
                            <InputSlot onPress={() => setShowNew(!showNew)}>
                                <InputIcon as={showNew ? EyeOffIcon : EyeIcon} />
                            </InputSlot>
                        </Input>

                        {/* Strength */}
                        {newPassword.length > 0 && (
                            <Text className="text-sm text-gray-500">
                                Strength: {getPasswordStrength()}
                            </Text>
                        )}

                        {/* Confirm */}
                        <Input>
                            <InputField
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirm}
                            />
                            <InputSlot onPress={() => setShowConfirm(!showConfirm)}>
                                <InputIcon as={showConfirm ? EyeOffIcon : EyeIcon} />
                            </InputSlot>
                        </Input>

                        {/* Error */}
                        {error ? (
                            <Text className="text-red-500 text-sm">
                                {error}
                            </Text>
                        ) : null}

                        <Button
                            onPress={handleChangePassword}
                            isDisabled={passwordLoading}
                        >
                            <ButtonText>
                                {passwordLoading ? "Updating..." : "Change Password"}
                            </ButtonText>
                        </Button>

                    </Box>

                </Box>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
}