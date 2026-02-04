import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/ui/icon";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { router } from 'expo-router';
import { useLocalSearchParams } from "expo-router/build/hooks";
import { ScrollView } from "react-native";

export default function DataCollectionScreen() {
    const { station, date, time } = useLocalSearchParams();

    const navigateToDataCollection2Screen = () => {
        router.push({
            pathname: '/data-collection2',
            params: {
                station: station,
                date: date ? date.toString() : undefined,
                time: time ? time.toString() : undefined
            }
        });
    }

    return (
        <ScrollView>
            <VStack className="p-4">
                <Box className="bg-gray-200 rounded-lg p-4 mb-8">
                    <Text className="text-lg">
                        <Text className="font-bold text-lg">Station: </Text>
                        {station}
                    </Text>
                    <Text className="text-lg">
                        <Text className="font-bold text-lg">Date: </Text>
                        {date}
                    </Text>
                    <Text className="text-lg">
                        <Text className="font-bold text-lg">Time: </Text>
                        {time}
                    </Text>
                </Box>

                {/* VISIBILITY */}
                <Box className="flex flex-row bg-gray-200 rounded-t-lg p-4 gap-4">
                    <VStack className="flex-1 items-center" space="sm">
                        <Box className="flex flex-row items-center">
                            <Text className="w-36 pr-2">HT of Lowest Level</Text>
                            <Input
                                variant="outline"
                                isDisabled={false}
                                isInvalid={false}
                                isReadOnly={false}
                                className="flex-1"
                            >
                                <InputField />
                            </Input>
                        </Box>
                        <Box className="flex flex-row items-center">
                            <Text className="w-36 pr-2">Visibility</Text>
                            <Input
                                variant="outline"
                                isDisabled={false}
                                isInvalid={false}
                                isReadOnly={false}
                                className="flex-1"
                            >
                                <InputField />
                            </Input>
                        </Box>
                        <Box className="flex flex-row items-center">
                            <Text className="w-36 pr-2">Summation Total</Text>
                            <Input
                                variant="outline"
                                isDisabled={false}
                                isInvalid={false}
                                isReadOnly={false}
                                className="flex-1"
                            >
                                <InputField />
                            </Input>
                        </Box>
                    </VStack>
                    <Box className="items-center justify-center w-24">
                        <Text className="text-center italic">Visibility</Text>
                    </Box>
                </Box>

                {/* WIND */}
                <Box className="flex flex-row bg-white p-4 gap-4">
                    <VStack className="flex-1 items-center" space="sm">
                        <Box className="flex flex-row items-center">
                            <Text className="w-36 pr-2">Direction(Degrees)</Text>
                            <Input
                                variant="outline"
                                isDisabled={false}
                                isInvalid={false}
                                isReadOnly={false}
                                className="flex-1"
                            >
                                <InputField />
                            </Input>
                        </Box>
                        <Box className="flex flex-row items-center">
                            <Text className="w-36 pr-2">Speed(MPS)</Text>
                            <Input
                                variant="outline"
                                isDisabled={false}
                                isInvalid={false}
                                isReadOnly={false}
                                className="flex-1"
                            >
                                <InputField />
                            </Input>
                        </Box>
                    </VStack>
                    <Box className="flex items-center justify-center w-24">
                        <Text className="text-center italic">Wind</Text>
                    </Box>
                </Box>

                {/* TEMPERATURE */}
                <Box className="flex flex-row bg-gray-200 p-4 gap-4">
                    <VStack className="flex-1 items-center" space="sm">
                        <Box className="flex flex-row items-center">
                            <Text className="w-36 pr-2">Dry Bulb(°C)</Text>
                            <Input
                                variant="outline"
                                isDisabled={false}
                                isInvalid={false}
                                isReadOnly={false}
                                className="flex-1"
                            >
                                <InputField />
                            </Input>
                        </Box>
                        <Box className="flex flex-row items-center">
                            <Text className="w-36 pr-2">Wet Bulb(°C)</Text>
                            <Input
                                variant="outline"
                                isDisabled={false}
                                isInvalid={false}
                                isReadOnly={false}
                                className="flex-1"
                            >
                                <InputField />
                            </Input>
                        </Box>
                        <Box className="flex flex-row items-center">
                            <Text className="w-36 pr-2">Dew Point(°C)</Text>
                            <Input
                                variant="outline"
                                isDisabled={false}
                                isInvalid={false}
                                isReadOnly={false}
                                className="flex-1"
                            >
                                <InputField />
                            </Input>
                        </Box>
                        <Box className="flex flex-row items-center">
                            <Text className="w-36 pr-2">Relative Humidity</Text>
                            <Input
                                variant="outline"
                                isDisabled={false}
                                isInvalid={false}
                                isReadOnly={false}
                                className="flex-1"
                            >
                                <InputField />
                            </Input>
                        </Box>
                        <Box className="flex flex-row items-center">
                            <Text className="w-36 pr-2">Max. Temperature</Text>
                            <Input
                                variant="outline"
                                isDisabled={false}
                                isInvalid={false}
                                isReadOnly={false}
                                className="flex-1"
                            >
                                <InputField />
                            </Input>
                        </Box>
                        <Box className="flex flex-row items-center">
                            <Text className="w-36 pr-2">Min. Temperature</Text>
                            <Input
                                variant="outline"
                                isDisabled={false}
                                isInvalid={false}
                                isReadOnly={false}
                                className="flex-1"
                            >
                                <InputField />
                            </Input>
                        </Box>
                    </VStack>
                    <Box className="w-24 flex items-center justify-center">
                        <Text className="text-center italic">Temperature</Text>
                    </Box>
                </Box>

                {/* PRESSURE GROUP */}
                <Box className="flex flex-row bg-white p-4 gap-4">
                    <VStack className="flex-1 items-center" space="sm">
                        <Box className="flex flex-row items-center">
                            <Text className="w-36 pr-2">Station Pressure</Text>
                            <Input
                                variant="outline"
                                isDisabled={false}
                                isInvalid={false}
                                isReadOnly={false}
                                className="flex-1"
                            >
                                <InputField value="1.7" />
                            </Input>
                        </Box>
                        <Box className="flex flex-row items-center">
                            <Text className="w-36 pr-2">MSL Pressure</Text>
                            <Input
                                variant="outline"
                                isDisabled={false}
                                isInvalid={false}
                                isReadOnly={false}
                                className="flex-1"
                            >
                                <InputField />
                            </Input>
                        </Box>
                        <Box className="flex flex-row items-center">
                            <Text className="w-36 pr-2">Tendency</Text>
                            <Input
                                variant="outline"
                                isDisabled={false}
                                isInvalid={false}
                                isReadOnly={false}
                                className="flex-1"
                            >
                                <InputField />
                            </Input>
                        </Box>
                        <Box className="flex flex-row items-center">
                            <Text className="w-36 pr-2">NET 3-hr Change</Text>
                            <Input
                                variant="outline"
                                isDisabled={false}
                                isInvalid={false}
                                isReadOnly={false}
                                className="flex-1"
                            >
                                <InputField />
                            </Input>
                        </Box>
                        <Box className="flex flex-row items-center">
                            <Text className="w-36 pr-2">Altimeter Setting</Text>
                            <Input
                                variant="outline"
                                isDisabled={false}
                                isInvalid={false}
                                isReadOnly={false}
                                className="flex-1"
                            >
                                <InputField />
                            </Input>
                        </Box>
                        <Box className="flex flex-row items-center">
                            <Text className="w-36 pr-2">Barometer</Text>
                            <Input
                                variant="outline"
                                isDisabled={false}
                                isInvalid={false}
                                isReadOnly={false}
                                className="flex-1"
                            >
                                <InputField />
                            </Input>
                        </Box>
                        <Box className="flex flex-row items-center">
                            <Text className="w-36 text-sm">Barometer Temperature</Text>
                            <Input
                                variant="outline"
                                isDisabled={false}
                                isInvalid={false}
                                isReadOnly={false}
                                className="flex-1"
                            >
                                <InputField />
                            </Input>
                        </Box>
                        <Box className="flex flex-row items-center">
                            <Text className="w-36 text-sm">Barometer Correction</Text>
                            <Input
                                variant="outline"
                                isDisabled={false}
                                isInvalid={false}
                                isReadOnly={false}
                                className="flex-1"
                            >
                                <InputField />
                            </Input>
                        </Box>
                        <Box className="flex flex-row items-center">
                            <Text className="w-36 pr-2">Barograph</Text>
                            <Input
                                variant="outline"
                                isDisabled={false}
                                isInvalid={false}
                                isReadOnly={false}
                                className="flex-1"
                            >
                                <InputField />
                            </Input>
                        </Box>
                        <Box className="flex flex-row items-center">
                            <Text className="text-sm w-36">Barograph Correction</Text>
                            <Input
                                variant="outline"
                                isDisabled={false}
                                isInvalid={false}
                                isReadOnly={false}
                                className="flex-1"
                            >
                                <InputField />
                            </Input>
                        </Box>
                    </VStack>
                    <Box className="w-24 flex items-center justify-center">
                        <Text className="text-center italic">Pressure Group</Text>
                    </Box>
                </Box>

                <Box className="my-4 w-fit flex-none self-end">
                    <Button onPress={navigateToDataCollection2Screen}>
                        <ButtonText>Next</ButtonText>
                        <ButtonIcon as={ArrowRightIcon}></ButtonIcon>
                    </Button>
                </Box>
            </VStack>
        </ScrollView>
    );
}