import { Box } from "@/components/ui/box";
import { Fab, FabIcon, FabLabel } from "@/components/ui/fab";
import { CalendarDaysIcon, ChevronsRightIcon, ChevronsUpDownIcon, Icon } from "@/components/ui/icon";
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
    SelectTrigger
} from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { router } from "expo-router";
import { useEffect, useState } from "react";

export default function DateTimeScreen() {
    const [station, setStation] = useState<string | undefined>(undefined);
    const [date, setDate] = useState<String>(new Date().toLocaleDateString());
    const [time, setTime] = useState<String | undefined>(undefined);
    const [isContinueDisabled, setIsContinueDisabled] = useState<boolean>(true);

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
            design: "material",
            maximumDate: nowUtc,
            onChange: (event, selectedDate) => {
                const currentDate = selectedDate?.toLocaleDateString() || date;
                setDate(currentDate);
            },
            mode: 'date',
            is24Hour: true,
        });
    };

    const navigateToDataCollectionScreen = () => {
        router.push({
            pathname: '/data-collection1',
            params: {
                station: station,
                date: date ? date.toString() : undefined,
                time: time ? time.toString() : undefined
            }
        });
    };

    return (
        <Box className="flex-1 p-4">
            <VStack space="md">
                {/* Station Box */}
                <Box className="flex flex-row gap-4 items-center">
                    <Text className="block text-lg font-semibold w-16">Station:</Text>
                    <Select className="flex-1" onValueChange={(value) => setStation(value)}>
                        <SelectTrigger className="flex justify-between" variant="outline" size="md">
                            <SelectInput placeholder="Select station" />
                            <SelectIcon className="mr-3" as={ChevronsUpDownIcon} />
                        </SelectTrigger>
                        <SelectPortal>
                            <SelectBackdrop />
                            <SelectContent>
                                <SelectDragIndicatorWrapper>
                                    <SelectDragIndicator />
                                </SelectDragIndicatorWrapper>
                                <SelectItem label="Mactan" value="Mactan" isDisabled={true} />
                                <SelectItem label="Puerto Princesa Complex" value="Puerto Princesa Complex" />
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
                        <SelectPortal>
                            <SelectBackdrop />
                            <SelectContent>
                                <SelectDragIndicatorWrapper>
                                    <SelectDragIndicator />
                                </SelectDragIndicatorWrapper>

                                {Array.from({ length: 24 }, (_, i) => {
                                    const hour = i.toString().padStart(2, '0') + '00';
                                    return <SelectItem key={hour} label={hour} value={hour} />;
                                })}
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
                <FabIcon as={ChevronsRightIcon} />
            </Fab>
        </Box>
    );
}