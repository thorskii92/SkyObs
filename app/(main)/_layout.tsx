import BottomNavigationBar from "@/src/components/BottomNavigationBar";
import TopNavigationBar from "@/src/components/TopNavigationBar";
import { Tabs } from "expo-router";

export default function MainLayout() {
    return (
        <>
            <TopNavigationBar />

            <Tabs
                screenOptions={{
                    headerShown: false,
                }}
                tabBar={(props) => <BottomNavigationBar {...props} />}
            >
                <Tabs.Screen
                    name="index"
                    options={{ title: "Home" }}
                />

                <Tabs.Screen
                    name="sms-history"
                    options={{ title: "SMS" }}
                />

                <Tabs.Screen
                    name="manual"
                    options={{ title: "Manual" }}
                />

                {/* ✅ FIXED: use folder name, not index */}
                <Tabs.Screen
                    name="settings"
                    options={{ title: "Settings" }}
                />
            </Tabs>
        </>
    );
}