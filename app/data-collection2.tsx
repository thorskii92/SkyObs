import { AlertDialog, AlertDialogBackdrop, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader } from "@/components/ui/alert-dialog";
import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { DownloadIcon } from "@/components/ui/icon";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { Textarea, TextareaInput } from '@/components/ui/textarea';
import { VStack } from "@/components/ui/vstack";
import { router } from 'expo-router';
import { useLocalSearchParams } from "expo-router/build/hooks";
import React, { useState } from "react";
import { ScrollView } from "react-native";

export default function DataCollectionScreen() {
    const { station, date, time } = useLocalSearchParams();

    const [showAlertDialog, setShowAlertDialog] = useState(false);

    const handleCloseAlertDialog = () => {
        setShowAlertDialog(false);
    }

    const navigateToHomeScreen = () => {
        handleCloseAlertDialog();
        router.push("/");
    }

    return (
        <ScrollView>
            <VStack className="p-4">
                {/* ATMOSPHERIC PHENOMENA */}
                <Box className="flex flex-row bg-gray-200 rounded-t-lg p-4 gap-4">
                    <VStack className="flex-1 items-center" space="sm">
                        <Box className="flex flex-row items-center">
                            <Text className="w-36 pr-2">Rainfall Amount(mm)</Text>
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
                            <Text className="w-36 pr-2">Observed Period</Text>
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
                            <Text className="w-36 pr-2">Present Weather</Text>
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
                            <Text className="w-36 pr-2">Past Weather</Text>
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
                        <Text className="text-center italic">Atmospheric Phenomena</Text>
                    </Box>
                </Box>

                {/* Cloud Group */}
                <Box className="flex flex-row bg-white p-4 gap-4">
                    <VStack className="flex-1 items-center" space="sm">
                        <Box className="flex flex-row items-center">
                            <Text className="w-36 pr-2">Amount of CL Cloud</Text>
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
                        <Text className="text-center italic"></Text>
                    </Box>
                </Box>
                <Box className="flex flex-row bg-gray-200 rounded-t-lg p-4 gap-4">
                    <VStack className="flex-1 items-center" space="sm">
                        <Box className="flex flex-row items-center">
                            <Text className="w-36 pr-2">Amount</Text>
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
                            <Text className="w-36 pr-2">Type</Text>
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
                            <Text className="w-36 pr-2">Height</Text>
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
                        <Text className="text-center italic">First Layer</Text>
                    </Box>
                </Box>
                <Box className="flex flex-row bg-white rounded-t-lg p-4 gap-4">
                    <VStack className="flex-1 items-center" space="sm">
                        <Box className="flex flex-row items-center">
                            <Text className="w-36 pr-2">Amount</Text>
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
                            <Text className="w-36 pr-2">Type</Text>
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
                            <Text className="w-36 pr-2">Height</Text>
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
                        <Text className="text-center italic">Second Layer</Text>
                    </Box>
                </Box>

                <Box className="flex flex-row bg-gray-200 rounded-t-lg p-4 gap-4">
                    <VStack className="flex-1 items-center" space="sm">
                        <Box className="flex flex-row items-center">
                            <Text className="w-36 pr-2">Amount</Text>
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
                            <Text className="w-36 pr-2">Type</Text>
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
                            <Text className="w-36 pr-2">Height</Text>
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
                        <Text className="text-center italic">Third Layer</Text>
                    </Box>
                </Box>

                <Box className="flex flex-row bg-white rounded-t-lg p-4 gap-4">
                    <VStack className="flex-1 items-center" space="sm">
                        <Box className="flex flex-row items-center">
                            <Text className="w-36 pr-2">Amount</Text>
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
                            <Text className="w-36 pr-2">Type</Text>
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
                            <Text className="w-36 pr-2">Height</Text>
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
                        <Text className="text-center italic">Fourth Layer</Text>
                    </Box>
                </Box>
                <Box className="flex flex-row bg-gray-200 p-4 gap-4">
                    <VStack className="flex-1 items-center" space="sm">
                        <Box className="flex flex-row items-center">
                            <Text className="w-36 pr-2">Ceiling</Text>
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
                        <Text className="text-center italic"></Text>
                    </Box>
                </Box>
                <Box className="flex flex-row bg-white p-4 gap-4">
                    <VStack className="flex-1 items-center" space="sm">
                        <Box className="flex flex-row items-center">
                            <Text className="w-36 pr-2">Direction of Low Clouds</Text>
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
                        <Text className="text-center italic"></Text>
                    </Box>
                </Box>
                <Box className="flex flex-row bg-gray-200 p-4 gap-4">
                    <VStack className="flex-1 items-center" space="sm">
                        <Box className="flex flex-row items-center">
                            <Text className="w-36 pr-2">Direction of High Clouds</Text>
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
                        <Text className="text-center italic"></Text>
                    </Box>
                </Box>

                <Box className="flex flex-row bg-white p-4 gap-4">
                    <VStack className="flex-1 items-center" space="sm">
                        <Box className="flex flex-row items-center">
                            <Text className="w-36 pr-2">Remarks</Text>
                            <Textarea className="flex-1">
                                <TextareaInput />
                            </Textarea>
                        </Box>

                    </VStack>
                    <Box className="flex items-center justify-center w-24">
                        <Text className="text-center italic"></Text>
                    </Box>
                </Box>
                <Box className="flex flex-row bg-gray-200 p-4 gap-4">
                    <VStack className="flex-1 items-center" space="sm">
                        <Box className="flex flex-row items-center">
                            <Text className="w-36 pr-2">Observer's Signature</Text>
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
                        <Text className="text-center italic"></Text>
                    </Box>
                </Box>
                <Box className="my-4 w-fit flex-none self-end">
                    <Button onPress={() => setShowAlertDialog(true)}>
                        <ButtonText>Save</ButtonText>
                        <ButtonIcon as={DownloadIcon}></ButtonIcon>
                    </Button>
                </Box>
            </VStack>

            <AlertDialog isOpen={showAlertDialog} onClose={handleCloseAlertDialog} size="md">
                <AlertDialogBackdrop />
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <Heading className="text-typography-950 font-semibold" size="md">
                            Save Observation Data?
                        </Heading>
                    </AlertDialogHeader>

                    <AlertDialogBody className="mt-3 mb-4">
                        <Text size="sm">
                            The collected atmospheric data will be saved temporarily and
                            flagged for quality control review. During this process, the data
                            can be checked for consistency, accuracy, and completeness before
                            final submission.
                            Do you want to proceed?
                        </Text>
                    </AlertDialogBody>

                    <AlertDialogFooter>
                        <Button
                            variant="outline"
                            action="secondary"
                            onPress={handleCloseAlertDialog}
                            size="sm"
                        >
                            <ButtonText>Cancel</ButtonText>
                        </Button>

                        <Button size="sm" onPress={navigateToHomeScreen}>
                            <ButtonText>Save for QC Review</ButtonText>
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </ScrollView>
    );
}