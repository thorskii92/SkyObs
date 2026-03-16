import {
    AlertDialog,
    AlertDialogBackdrop,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { getDB, getLAerodromeData, getLSynopData } from "@/src/utils/db";
import { LinearGradient } from "expo-linear-gradient";
import { Clock2Icon, XIcon } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
    Animated,
    NativeScrollEvent,
    NativeSyntheticEvent,
} from "react-native";

const HOURS = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0") + "00"
);

const ITEM_HEIGHT = 60;
const PICKER_HEIGHT = ITEM_HEIGHT * 5;

export default function TimePicker({
    time,
    setTime,
    stationID,
    date,
    category = "SYNOP",
}: {
    time: string;
    setTime: (t: string) => void;
    stationID: number | undefined;
    date: string;
    category: "SYNOP" | "METAR" | "SPECI";
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [takenHours, setTakenHours] = useState<string[]>([]);

    const scrollY = useRef(new Animated.Value(0)).current;
    const scrollRef = useRef<Animated.ScrollView>(null);

    const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = e.nativeEvent.contentOffset.y;
        const index = Math.round(offsetY / ITEM_HEIGHT);
        const clamped = Math.max(0, Math.min(HOURS.length - 1, index));
        const selectedHour = HOURS[clamped];

        if (!takenHours.includes(selectedHour)) {
            setTime(selectedHour);
        }
    };


    /**
     * Center selected time when dialog opens
     */
    useEffect(() => {
        if (isOpen) {
            const index = HOURS.findIndex((h) => h === time);
            const scrollIndex = index === -1 ? 0 : index;
            const y = scrollIndex * ITEM_HEIGHT;

            setTimeout(() => {
                scrollRef.current?.scrollTo({
                    y,
                    animated: false,
                });
                scrollY.setValue(y);
            }, 50);
        }
    }, [isOpen, time]);

    /**
     * Fetch unavailable hours for selected station and date
     * (these are hours that already exist in the database)
     */
    useEffect(() => {
        if (!stationID || !date) return;

        const fetchTakenHours = async () => {
            try {
                const db = await getDB();
                let data: any[] = [];

                switch (category) {
                    case "SYNOP":
                        data = await getLSynopData(db, stationID, undefined, date);
                        break;

                    case "METAR":
                    case "SPECI":
                        // MorS logic: aerodrome reports
                        data = await getLAerodromeData(db, stationID, category, undefined, date);
                        break;

                    default:
                        console.warn(`Unknown category "${category}"`);
                        data = [];
                }

                const hours = data.map(d => d.sHour);
                setTakenHours(hours);
            } catch (error) {
                console.error("Error fetching taken hours:", error);
                setTakenHours([]);
            }
        };

        fetchTakenHours();
    }, [stationID, date, category]);

    return (
        <>
            {/* Trigger */}
            <Box className="gap-2 flex-1">
                <Text className="text-lg font-semibold w-16">Time:</Text>

                <Button
                    variant="outline"
                    className="flex-1 justify-between border-neutral-300"
                    onPress={() => setIsOpen(true)}
                >
                    <ButtonText className="font-normal text-neutral-700">{time || "Select time"}</ButtonText>
                    <ButtonIcon as={Clock2Icon} className="absolute right-3 text-gray-400" />
                </Button>
            </Box>

            {/* Dialog */}
            <AlertDialog isOpen={isOpen} onClose={() => setIsOpen(false)}>
                <AlertDialogBackdrop />

                <AlertDialogContent className="w-64">
                    {/* Header with X button */}
                    <AlertDialogHeader className="flex-row items-center justify-between">
                        <Text className="text-xl font-semibold text-center flex-1">
                            Select Time
                        </Text>
                        <Pressable
                            onPress={() => setIsOpen(false)}
                            className="p-2 rounded-full bg-gray-100 ml-2"
                        >
                            <Icon as={XIcon} className="text-gray-500" />
                        </Pressable>
                    </AlertDialogHeader>

                    <AlertDialogBody>
                        <Box
                            style={{ height: PICKER_HEIGHT }}
                            className="relative overflow-hidden"
                        >
                            {/* Center indicator */}
                            <Box
                                style={{
                                    position: "absolute",
                                    top: PICKER_HEIGHT / 2 - ITEM_HEIGHT / 2,
                                    height: ITEM_HEIGHT,
                                    left: 0,
                                    right: 0,
                                    borderTopWidth: 1,
                                    borderBottomWidth: 1,
                                    zIndex: -10,
                                }}
                            />

                            <Animated.ScrollView
                                ref={scrollRef}
                                showsVerticalScrollIndicator={false}
                                snapToInterval={ITEM_HEIGHT}
                                decelerationRate="fast"
                                scrollEventThrottle={16}
                                onMomentumScrollEnd={handleScrollEnd}
                                onScroll={Animated.event(
                                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                                    { useNativeDriver: true }
                                )}
                                contentContainerStyle={{
                                    paddingVertical:
                                        PICKER_HEIGHT / 2 - ITEM_HEIGHT / 2,
                                }}
                            >
                                {HOURS.map((hour, index) => {
                                    const inputRange = [
                                        (index - 2) * ITEM_HEIGHT,
                                        (index - 1) * ITEM_HEIGHT,
                                        index * ITEM_HEIGHT,
                                        (index + 1) * ITEM_HEIGHT,
                                        (index + 2) * ITEM_HEIGHT,
                                    ];

                                    const scale = scrollY.interpolate({
                                        inputRange,
                                        outputRange: [0.8, 0.9, 1.2, 0.9, 0.8],
                                        extrapolate: "clamp",
                                    });

                                    const opacity = scrollY.interpolate({
                                        inputRange,
                                        outputRange: [0.3, 0.6, 1, 0.6, 0.3],
                                        extrapolate: "clamp",
                                    });

                                    const isTaken = takenHours.includes(hour);

                                    return (
                                        <Animated.View
                                            key={hour}
                                            style={{
                                                height: ITEM_HEIGHT,
                                                justifyContent: "center",
                                                alignItems: "center",
                                                transform: [{ scale }],
                                                opacity,
                                            }}
                                        >
                                            <Text
                                                className={`text-xl font-semibold ${isTaken ? "text-gray-300" : "text-black"
                                                    }`}
                                            >
                                                {hour}
                                            </Text>
                                        </Animated.View>
                                    );
                                })}
                            </Animated.ScrollView>

                            {/* Top fade */}
                            <LinearGradient
                                colors={["white", "transparent"]}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: 80,
                                    zIndex: 10,
                                }}
                                pointerEvents="none"
                            />

                            {/* Bottom fade */}
                            <LinearGradient
                                colors={["transparent", "white"]}
                                style={{
                                    position: "absolute",
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: 80,
                                    zIndex: 10,
                                }}
                                pointerEvents="none"
                            />
                        </Box>
                    </AlertDialogBody>
                    <AlertDialogFooter className="flex-row justify-end p-3 gap-2">
                        <Button
                            variant="solid"
                            className="w-full"
                            disabled={
                                !time || takenHours.includes(time) || takenHours.length === 24
                            }
                            onPress={() => setIsOpen(false)}
                        >
                            <ButtonText className="text-white">Confirm</ButtonText>
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}