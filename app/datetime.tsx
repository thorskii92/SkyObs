import { Box } from "@/components/ui/box";
import { Fab, FabLabel } from "@/components/ui/fab";
import { CalendarDaysIcon, ChevronsUpDownIcon, Icon } from "@/components/ui/icon";
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
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Station } from "@/src/models/station";
import { getStations } from "@/src/utils/api";
import { getDB, getLStations } from "@/src/utils/db";
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import NetInfo from "@react-native-community/netinfo";
import { router } from "expo-router";
import { useEffect, useState } from "react";

interface HourType {
    time: string;
}

export default function DateTimeScreen() {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [stations, setStations] = useState<Station[]>([]);
    const [station, setStation] = useState<Station | null>(null);
    const [date, setDate] = useState<String>(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState<String | null>(null);
    const [isContinueDisabled, setIsContinueDisabled] = useState<boolean>(true);

    useEffect(() => {
        const fetchStations = async () => {
            setIsLoading(true);

            try {
                const netState = await NetInfo.fetch();

                let results: any[] = [];

                if (netState.isConnected && netState.isInternetReachable) {
                    try {
                        const apiResults = await getStations();
                        if (apiResults && Array.isArray(apiResults)) {
                            results = apiResults;
                        } else {
                            console.warn("Unexpected API response, falling back to local DB");
                        }
                    } catch (apiError) {
                        console.warn("API fetch failed, falling back to local DB:", apiError);
                    }
                }

                if (results.length === 0) {
                    const db = await getDB();
                    // Offline or API failed → use local SQLite
                    console.log("Using local stations from SQLite");
                    results = await getLStations(db); // pass your db instance
                }

                setStations(results);

            } catch (error) {
                console.error("Unexpected error fetching stations:", error);
                setStations([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStations();
    }, []);

    useEffect(() => {
        if (station && date && time) {
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
            maximumDate: nowUtc,
            onChange: (event, selectedDate) => {
                const currentDate = selectedDate?.toISOString().split("T")[0] || date;
                setDate(currentDate);
            },
            mode: 'date',
            is24Hour: true,
        });
    };

    const hours = Array.from({ length: 24 }, (_, i) => {
        const hour = `${i.toString().padStart(2, "0")}00`;
        return { label: hour, value: hour };
    });

    const navigateToDataCollectionScreen = () => {
        router.push({
            pathname: '/data-collection',
            params: {
                stationId: station?.Id,
                stationName: station?.stnName,
                mslCor: station?.mslCor,
                altCor: station?.altCor,
                date: date ? date.toString() : undefined,
                time: time ? time.toString() : undefined,
                status: "new",
            }
        });
    };

    if (isLoading) {
        return (
            <Box className="flex-1 justify-center items-center">
                <Text>Loading...</Text>
            </Box>
        );
    }

    return (
        <Box className="flex-1 p-4">
            <VStack space="md">
                {/* Station Box */}
                <Box className="flex flex-row gap-4 items-center">
                    <Text className="block text-lg font-semibold w-16">Station:</Text>

                    <Select className="flex-1" onValueChange={(value) => {
                        // value comes as a string from Select, convert to number
                        const selectedId = Number(value);
                        const chosenStation = stations.find((s) => s.Id === selectedId) || null;

                        setStation(chosenStation);
                    }}>
                        <SelectTrigger className="flex justify-between" variant="outline" size="md">
                            <SelectInput placeholder="Select station" />
                            <SelectIcon className="mr-3" as={ChevronsUpDownIcon} />
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
                                            label={item.stnName}
                                            value={item.Id.toString()}
                                            style={{ flex: 1 }}
                                        />
                                    )}
                                />
                            </SelectContent>
                        </SelectPortal>
                    </Select>
                </Box>


                {/* Date Box */}
                <Box className="flex flex-row gap-4 items-center">
                    <Text className="block text-lg font-semibold w-16">Date:</Text>
                    <Pressable className="flex flex-grow flex-row border border-outline-200 rounded py-2 px-4 items-center justify-between" onPress={showDatePicker}>
                        <Text className="block">
                            {date}
                        </Text>
                        <Icon as={CalendarDaysIcon} className="block ml-2 text-gray-400" />
                    </Pressable>
                </Box>

                {/* Time Box */}
                <Box className="flex flex-row gap-4 items-center">
                    <Text className="block text-lg font-semibold w-16">Time:</Text>
                    <Select className="flex-1" onValueChange={(value) => { setTime(value) }}>
                        <SelectTrigger className="flex justify-between" variant="outline" size="md">
                            <SelectInput placeholder="Select time" />
                            <SelectIcon className="mr-3" as={ChevronsUpDownIcon} />
                        </SelectTrigger>
                        <SelectPortal snapPoints={[40]}>
                            <SelectBackdrop />
                            <SelectContent>
                                <SelectDragIndicatorWrapper>
                                    <SelectDragIndicator />
                                </SelectDragIndicatorWrapper>
                                <SelectVirtualizedList
                                    data={hours}
                                    centerContent={true}
                                    getItem={(data, index) => data[index]}
                                    getItemCount={(data) => data.length}
                                    // @ts-ignore
                                    keyExtractor={(item, index) => item.value}
                                    // @ts-ignore
                                    renderItem={({ item }: { item: typeof hours[0] }) => (
                                        <SelectItem label={item.label} value={item.value} />
                                    )}
                                />
                            </SelectContent>
                        </SelectPortal>
                    </Select>
                </Box>
            </VStack>

            <Fab
                placement="bottom right"
                isHovered={false}
                isDisabled={isContinueDisabled}
                isPressed={false}
                size="lg"
                className="bg-primary-600 hover:bg-primary-700 active:bg-primary-800 mb-14"
                onPress={navigateToDataCollectionScreen}
            >
                <FabLabel className='font-semibold'>Continue</FabLabel>
            </Fab>
        </Box>
    );
}