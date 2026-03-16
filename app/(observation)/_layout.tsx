import TopNavigationBar from "@/src/components/TopNavigationBar";
import { Stack } from "expo-router";

export default function ObservationStackLayout() {
  return (
    <>
      <TopNavigationBar />

      <Stack
        screenOptions={{
          headerShown: false,           // show top header if you want
        }}
      >
        <Stack.Screen
          name="options"
          options={{ title: "Choose Observation" }}
        />
        <Stack.Screen
          name="(SYNOP)/datetime"
          options={{ title: "Select Date & Time (SYNOP)" }}
        />
        <Stack.Screen
          name="(MorS)/datetime"
          options={{ title: "Select Date & Time (MorS)" }}
        />
        <Stack.Screen
          name="(SYNOP)/data-collection"
          options={{ title: "Data Collection" }}
        />
        <Stack.Screen
          name="(MorS)/data-collection"
          options={{ title: "Data Collection" }}
        />
        <Stack.Screen
          name="view"
          options={{ title: "View Observed Data" }}
        />
        <Stack.Screen
          name="review"
          options={{ title: "Review Observed Data" }}
        />
      </Stack>
    </>


  );
}