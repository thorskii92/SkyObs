import { Box } from "@/components/ui/box";
import { Button, ButtonGroup, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import { Heading } from "@/components/ui/heading";
import { CalendarDaysIcon, Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import {
    Select,
    SelectBackdrop,
    SelectContent,
    SelectDragIndicator,
    SelectDragIndicatorWrapper,
    SelectIcon,
    SelectInput,
    SelectItem,
    SelectPortal,
    SelectTrigger,
    SelectVirtualizedList
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import TimePicker from "@/src/components/DateTime/TimePicker";
import GlobalLoading from "@/src/components/GlobalLoading";
import { useUser } from "@/src/context/UserContext";
import { Station } from "@/src/models/station";
import { API_URL, getStations } from "@/src/utils/api";
import { getDB, getLAerodromeData, getLStations } from "@/src/utils/db";
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from "expo-router";
import { Airplay, AlertTriangle, ChevronDownIcon } from "lucide-react-native";
import { useEffect, useState } from "react";

interface HourType {
    time: string;
}

export default function DateTime() {
    const params = useLocalSearchParams<{ MorS: "METAR" | "SPECI" }>();
    const MorS = params.MorS ?? "METAR";

    const { user } = useUser();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [stations, setStations] = useState<Station[]>([]);
    const [station, setStation] = useState<Station | null>(null);
    const getUTCDate = () => {
        const d = new Date();
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    };

    const [date, setDate] = useState<string>(getUTCDate());
    const getCurrentUTCTime = () => {
        const d = new Date();
        const hour = String(d.getUTCHours()).padStart(2, "0");
        const minute = String(d.getUTCMinutes()).padStart(2, "0");
        return `${hour}${minute}`;
    };
    const getCurrentUTCXX00 = async (stationId?: number, date?: string) => {
        const now = new Date();
        let hour = now.getUTCHours();
        const minute = now.getUTCMinutes();

        let resultHour;

        if (minute >= 45) {
            resultHour = (hour + 1) % 24;
        } else {
            resultHour = hour;
        }

        const candidate = `${resultHour.toString().padStart(2, "0")}00`;

        // If station/date not ready yet just return candidate
        if (!stationId || !date) return candidate;

        try {
            const db = await getDB();
            const aerodrome = await getLAerodromeData(db, stationId, MorS, undefined, date);

            const takenHours = aerodrome.map((d: any) => d.sHour);

            // if candidate is free → use it
            if (!takenHours.includes(candidate)) {
                return candidate;
            }

            // otherwise find next free hour
            for (let i = 1; i < 24; i++) {
                const nextHour = (resultHour + i) % 24;
                const next = `${nextHour.toString().padStart(2, "0")}00`;

                if (!takenHours.includes(next)) {
                    return next;
                }
            }

            // all hours taken
            return null;

        } catch (err) {
            console.warn("Failed to check taken hours:", err);
            return candidate;
        }
    };
    const [time, setTime] = useState<string | null>(null);

    // Updating time depending on date and station
    useEffect(() => {
        const updateTime = async () => {
            if (!station || !date) {
                setTime(null);
                return;
            }

            if (MorS === "SPECI") {
                setTime(getCurrentUTCTime());
                return;
            }

            const nextAvailable = await getCurrentUTCXX00(station.Id, date);
            setTime(nextAvailable);
        };

        updateTime();
    }, [station, date, MorS]);

    const [isContinueDisabled, setIsContinueDisabled] = useState<boolean>(true);
    const [isCancelDisabled, setIsCancelledDisabled] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    useEffect(() => {
        const checkInternet = async () => {
            try {
                const response = await fetch(
                    "https://clients3.google.com/generate_204",
                    { method: "GET" }
                );
                return response.status === 204;
            } catch {
                return false;
            }
        };

        const checkAPI = async () => {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 3000);

                const response = await fetch(API_URL, {
                    method: "HEAD",
                    signal: controller.signal,
                });

                clearTimeout(timeout);
                return response.ok;
            } catch {
                return false;
            }
        };

        const fetchStations = async () => {
            setIsLoading(true);

            try {
                const db = await getDB();

                let shouldSync = false;

                const hasInternet = await checkInternet();

                if (hasInternet) {
                    console.log("Internet available. Checking API...");
                    const apiReachable = await checkAPI();
                    if (apiReachable) {
                        console.log("API reachable. Will sync.");
                        shouldSync = true;
                    } else {
                        console.log("API not reachable. Using local DB.");
                    }
                } else {
                    console.log("No internet connection.");
                }

                if (shouldSync) {
                    try {
                        const apiResults = await getStations();
                        if (apiResults && Array.isArray(apiResults)) {
                            await syncStationsToLocal(db, apiResults);
                        }
                    } catch (err) {
                        console.warn("API fetch failed. Using local data.", err);
                    }
                }

                const localStations = await getLStations(db);
                setStations(localStations);

                const defaultStation =
                    localStations.find((s) => s.Id === user?.station_id) ||
                    null;
                setStation(defaultStation);

                let initialTime;

                if (MorS === "SPECI") {
                    initialTime = getCurrentUTCTime();
                } else {
                    initialTime = await getCurrentUTCXX00(defaultStation?.Id, date);
                }

                setTime(initialTime);
            } catch (error) {
                console.error("Unexpected error:", error);
                setStations([]);
                setStation(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStations();
    }, []);

    useEffect(() => {
        if (station && date && time !== null) {
            setIsContinueDisabled(false);
        } else {
            setIsContinueDisabled(true);
        }
    }, [station, date, time]);

    const showDatePicker = () => {
        const nowUtc = new Date(Date.UTC(
            new Date().getUTCFullYear(),
            new Date().getUTCMonth(),
            new Date().getUTCDate()
        ));

        DateTimePickerAndroid.open({
            value: new Date(),
            maximumDate: MorS === "SPECI" ? undefined : nowUtc,
            onChange: (event, selectedDate) => {
                const currentDate = selectedDate?.toISOString().split("T")[0] || date;
                setDate(currentDate);
            },
            mode: 'date',
            is24Hour: true,
        });
    };

    const showSpeciTimePicker = () => {
        const now = new Date();

        DateTimePickerAndroid.open({
            value: now,
            mode: "time",
            display: "spinner",
            is24Hour: true,
            onChange: (event, selectedDate) => {
                if (!selectedDate) return;

                const hour = selectedDate.getHours().toString().padStart(2, "0");
                const minute = selectedDate.getMinutes().toString().padStart(2, "0");

                setTime(`${hour}${minute}`);
            },
        });
    };

    const navigateToDataCollectionScreen = () => {
        if (isSubmitting) return;

        setIsSubmitting(true);
        setIsCancelledDisabled(true);
        setIsContinueDisabled(true);

        router.push({
            pathname: "/(observation)/(MorS)/data-collection",
            params: {
                stationId: station?.Id,
                stationICAO: station?.ICAO,
                stationName: station?.stnName,
                date: date ? date.toString() : undefined,
                time: time ? time.toString() : undefined,
                MorS: MorS,
            }
        });

        setIsSubmitting(false);
        setIsCancelledDisabled(false);
        setIsContinueDisabled(false);
    };

    const navigateToOptionsScreen = () => {
        router.back();
    }

    if (isLoading) {
        return <GlobalLoading />
    }

    return (
        <Box className="flex-1 p-8 bg-white">
            <Box className="gap-4 pt-4 rounded">
                <Center className="pt-4">
                    {/* Icon in rounded background */}
                    <Box
                        className={`p-5 rounded-full mb-4 ${MorS === "SPECI" ? "bg-yellow-400" : "bg-gray-100"
                            }`}
                    >
                        <Icon
                            as={MorS === "SPECI" ? AlertTriangle : Airplay}
                            size="xl"
                            className={MorS === "SPECI" ? "text-black" : "text-gray-500"}
                        />
                    </Box>

                    {/* Main Heading */}
                    <Heading
                        size="2xl"
                        className={`font-extrabold mb-2 text-center ${MorS === "SPECI" ? "text-black" : "text-gray-500"
                            }`}
                    >
                        {MorS}
                    </Heading>

                    {/* Subtext */}
                    <Text
                        size="lg"
                        className={`text-center`}
                    >
                        Select the station and time for this {MorS === "SPECI" ? "special " : ""}report.
                    </Text>
                </Center>
                <Box className="border border-gray-200 px-6 py-8 rounded-xl shadow-lg bg-white gap-2">
                    {/* Station Box */}
                    <Box className="gap-2 mb-2">
                        <Text className="block text-lg font-semibold">Select Station</Text>

                        <Select
                            onValueChange={(value) => {
                                const selectedId = Number(value);
                                const chosenStation = stations.find((s) => s.Id === selectedId) || null;
                                setStation(chosenStation);
                            }}
                        >
                            <SelectTrigger className="flex justify-between" variant="outline" size="md">
                                <SelectInput
                                    value={
                                        station
                                            ? `${station.wmoID}${station.stationID} - ${station.stnName}`
                                            : undefined
                                    }
                                    placeholder="Select station"
                                />
                                <SelectIcon className="absolute right-3" as={ChevronDownIcon} />
                            </SelectTrigger>

                            <SelectPortal snapPoints={[40]}>
                                <SelectBackdrop />

                                <SelectContent>
                                    <SelectDragIndicatorWrapper>
                                        <SelectDragIndicator />
                                    </SelectDragIndicatorWrapper>

                                    <SelectVirtualizedList
                                        data={stations}
                                        getItem={(data, index) => data[index]}
                                        getItemCount={(data) => data.length}
                                        // @ts-ignore
                                        keyExtractor={(item: Station, index: number) => item.Id.toString()}
                                        contentContainerStyle={{ paddingHorizontal: 8 }}
                                        // @ts-ignore
                                        renderItem={({ item }: { item: Station }) => (
                                            <SelectItem
                                                label={`${item.ICAO} - ${item.stnName}`}
                                                value={item.Id.toString()}
                                            />
                                        )}
                                    />
                                </SelectContent>
                            </SelectPortal>
                        </Select>
                    </Box>

                    <Box className="flex flex-row gap-2 mb-6">
                        {/* Date Box */}
                        <Box className="gap-2 flex-1">
                            <Text className="block text-lg font-semibold w-16">Date:</Text>
                            <Pressable className="flex flex-grow flex-row border border-outline-200 rounded py-2 px-4 items-center justify-between" onPress={showDatePicker}>
                                <Text className="block">
                                    {date}
                                </Text>
                                <Icon as={CalendarDaysIcon} className="block ml-2 text-gray-400" />
                            </Pressable>
                        </Box>

                        {MorS === "SPECI" ? (
                            <Box className="gap-2 flex-1">
                                <Text className="block text-lg font-semibold">Time:</Text>

                                <Pressable
                                    className="flex flex-row border border-outline-200 rounded py-2 px-4 items-center justify-between"
                                    onPress={showSpeciTimePicker}
                                >
                                    <Text>{time ?? "Select time"}</Text>
                                </Pressable>
                            </Box>
                        ) : (
                            <TimePicker
                                time={String(time ?? "")}
                                setTime={setTime}
                                date={date}
                                stationID={station?.Id}
                                category={MorS}
                            />
                        )}
                    </Box>

                    <ButtonGroup className="flex flex-row gap-2">
                        <Button
                            disabled={isCancelDisabled || isSubmitting}
                            size="lg"
                            action="secondary"
                            className="rounded-xl shadow-lg flex-1"
                            onPress={navigateToOptionsScreen}
                        >
                            <ButtonText>Cancel</ButtonText>
                        </Button>
                        <Button
                            isDisabled={isContinueDisabled || isSubmitting}
                            size="lg"
                            className="rounded-xl shadow-lg flex-1"
                            onPress={navigateToDataCollectionScreen}
                        >
                            {isSubmitting ? (
                                <><Spinner className="text-white" /><ButtonText>Proceeding</ButtonText></>
                            ) : (
                                <ButtonText>Continue</ButtonText>
                            )}
                        </Button>
                    </ButtonGroup>
                </Box>
            </Box>
        </Box>
    );
}

