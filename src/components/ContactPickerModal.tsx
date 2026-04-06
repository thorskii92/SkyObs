import {
    AlertDialog,
    AlertDialogBackdrop,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

import { Contact, useContacts } from "@/src/hooks/useContacts";
import React, { useEffect } from "react";
import { ScrollView } from "react-native";

interface ContactPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectContact: (contact: Contact, phoneNumber: string) => void;
}

export const ContactPickerModal: React.FC<ContactPickerModalProps> = ({
    isOpen,
    onClose,
    onSelectContact,
}) => {
    const { contacts, loading, error, requestPermission, fetchContacts } = useContacts();

    useEffect(() => {
        if (isOpen) {
            fetchContacts();
        }
    }, [isOpen]);

    const handleSelectPhoneNumber = (contact: Contact, phoneNumber: string) => {
        onSelectContact(contact, phoneNumber);
        onClose();
    };

    return (
        <AlertDialog isOpen={isOpen} onClose={onClose}>
            <AlertDialogBackdrop />
            <AlertDialogContent className="w-11/12">
                <AlertDialogHeader>
                    <Heading size="lg">Select Contact</Heading>
                </AlertDialogHeader>

                <AlertDialogBody>
                    {error && (
                        <Box className="bg-red-100 p-3 rounded-lg mb-4">
                            <Text className="text-red-600">{error}</Text>
                        </Box>
                    )}

                    {loading ? (
                        <VStack className="gap-2 items-center py-4">
                            <Spinner size="large" />
                            <Text>Loading contacts...</Text>
                        </VStack>
                    ) : contacts.length === 0 ? (
                        <Box className="py-4">
                            <Text className="text-gray-500 text-center">
                                No contacts with phone numbers found
                            </Text>
                        </Box>
                    ) : (
                        <ScrollView className="max-h-96">
                            <VStack className="gap-2">
                                {contacts.map((contact) => (
                                    <VStack
                                        key={contact.id}
                                        className="border border-gray-200 rounded-lg overflow-hidden"
                                    >
                                        <Box className="bg-gray-50 p-3 border-b border-gray-200">
                                            <Text className="font-semibold text-gray-800">
                                                {contact.name}
                                            </Text>
                                        </Box>

                                        <VStack className="p-3 gap-2">
                                            {contact.phoneNumbers.map((phone, index) => (
                                                <Pressable
                                                    key={index}
                                                    onPress={() =>
                                                        handleSelectPhoneNumber(contact, phone.number)
                                                    }
                                                    className="p-2 rounded-lg bg-blue-50 active:bg-blue-100"
                                                >
                                                    <HStack className="gap-2">
                                                        <VStack className="flex-1">
                                                            <Text className="text-gray-600 text-xs">
                                                                {phone.label}
                                                            </Text>
                                                            <Text className="font-mono text-sm">
                                                                {phone.number}
                                                            </Text>
                                                        </VStack>
                                                        <Text className="text-blue-600">→</Text>
                                                    </HStack>
                                                </Pressable>
                                            ))}
                                        </VStack>
                                    </VStack>
                                ))}
                            </VStack>
                        </ScrollView>
                    )}
                </AlertDialogBody>

                <Box className="gap-2 mt-2">
                    <Button onPress={onClose} variant="outline">
                        <ButtonText>Close</ButtonText>
                    </Button>
                </Box>
            </AlertDialogContent>
        </AlertDialog>
    );
};
