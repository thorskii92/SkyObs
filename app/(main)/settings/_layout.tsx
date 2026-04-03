import { Stack } from "expo-router";

export default function SettingsLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen
                name="index"
                options={{ title: "Settings" }}
            />

            <Stack.Screen
                name="user"
                options={{ title: "User Settings" }}
            />

            <Stack.Screen
                name="sms-recipients"
                options={{ title: "SMS Recipients" }}
            />

            <Stack.Screen
                name="code-templates"
                options={{ title: "Code Templates" }}
            />

            <Stack.Screen
                name="developers"
                options={{ title: "About Developers" }}
            />
        </Stack>
    );
}