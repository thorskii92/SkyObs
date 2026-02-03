import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { DownloadIcon } from "@/components/ui/icon";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { router } from 'expo-router';
import { useLocalSearchParams } from "expo-router/build/hooks";
import { ScrollView } from "react-native";

export default function DataCollectionScreen() {
    const { station, date, time } = useLocalSearchParams();

    const navigateToHomeScreen = () => {
        router.push("/");
    }

    return (
        <ScrollView>
            <VStack className="p-4">
                {/* ATMOSPHERIC PHENOMENA */}
                <Box className="flex flex-row bg-gray-200 rounded-t-lg p-4 gap-4">
                    <VStack className="flex-1 items-center" space="sm">
                        <Box className="flex flex-row items-center">
                            <Text className="w-36">Rainfall Amount(mm)</Text>
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
                            <Text className="w-36">Observed Period</Text>
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
                            <Text className="w-36">Present Weather</Text>
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
                            <Text className="w-36">Past Weather</Text>
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
                    <Box className="items-center justify-center px-4">
                        <Text className="text-center italic">Atmospheric Phenomena</Text>
                    </Box>
                </Box>

                {/* Cloud Group */}
                <Box className="flex flex-row bg-white p-4 gap-4">
                    <VStack className="flex-1 items-center" space="sm">
                        <Box className="flex flex-row items-center">
                            <Text className="w-36">Amount of CL Cloud</Text>
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
                    <Box className="flex items-center justify-center px-4">
                        <Text className="text-center italic"></Text>
                    </Box>
                </Box>
                

                <Box className="my-4 w-fit flex-none self-end">
                    <Button onPress={navigateToHomeScreen}>
                        <ButtonText>Save</ButtonText>
                        <ButtonIcon as={DownloadIcon}></ButtonIcon>
                    </Button>
                </Box>
            </VStack>
        </ScrollView>
    );
}