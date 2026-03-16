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
                <Tabs.Screen name="index" />
                <Tabs.Screen name="sms-history" />
                <Tabs.Screen name="manual" />
                <Tabs.Screen name="settings" />
            </Tabs>
        </>
    );
}