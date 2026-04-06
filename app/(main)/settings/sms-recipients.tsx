import {
    AlertDialog,
    AlertDialogBackdrop,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import {
    Select,
    SelectBackdrop,
    SelectContent,
    SelectInput,
    SelectItem,
    SelectPortal,
    SelectTrigger
} from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

import { useSQLiteContext } from "expo-sqlite";
import React, { useEffect, useState } from "react";

import { ContactPickerModal } from "@/src/components/ContactPickerModal";
import { Contact } from "@/src/hooks/useContacts";
import {
    deleteSmsRecipientAPI,
    upsertSmsRecipientAPI
} from "@/src/utils/api";
import {
    deleteSmsRecipient,
    getLCategories,
    getLSmsRecipients,
    upsertSmsRecipient
} from "@/src/utils/db";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SMSRecipientsScreen() {
    const db = useSQLiteContext();

    const [recipients, setRecipients] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);

    const [name, setName] = useState("");
    const [num, setNum] = useState("");
    const [cID, setCID] = useState<number | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [isOpen, setIsOpen] = useState(false);
    const [dialogType, setDialogType] = useState<"save" | "delete" | null>(null);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);

    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [showContactPicker, setShowContactPicker] = useState(false);

    const loadData = async () => {
        const r = await getLSmsRecipients(db, { stnId: 1 });
        const c = await getLCategories(db);

        setRecipients(r);
        setCategories(c);

        if (c.length > 0 && cID === null) {
            setCID(c[0].cID);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const confirmSave = () => {
        if (!num || cID === null) return;
        setDialogType("save");
        setIsOpen(true);
    };

    const handleSelectContact = (contact: Contact, phoneNumber: string) => {
        setName(contact.name);
        // Format phone number (remove spaces/dashes)
        const formattedNumber = phoneNumber.replace(/[-()\s]/g, "");
        setNum(formattedNumber);
        // Keep the selected category or use the first one
        if (cID === null && categories.length > 0) {
            setCID(categories[0].cID);
        }
    };

    const handleEdit = (item: any) => {
        setEditingId(item.recipId);
        setName(item.name);
        setNum(item.num);
        setCID(item.cID);
    };

    const confirmDelete = (item: any) => {
        setSelectedItem(item);
        setDialogType("delete");
        setIsOpen(true);
    };

    const handleConfirm = async () => {
        try {
            if (dialogType === "save") {
                const payload = { stnId: 1, cID, num, name };

                // 🔒 LOCAL UPSERT
                try {
                    await upsertSmsRecipient(db, {
                        recipId: editingId ?? undefined,
                        ...payload,
                    });
                } catch (err: any) {
                    console.error("Local DB save failed:", err);
                    setErrorMessage(`Local save failed: ${err.message || err}`);
                    return;
                }

                // 🌐 API UPSERT
                try {
                    const apiResult = await upsertSmsRecipientAPI(payload);
                    if (!apiResult) {
                        throw new Error("API response invalid");
                    }
                } catch (err: any) {
                    console.warn("API sync failed (save):", err);
                    setErrorMessage(`API sync failed: ${err.message || err}`);
                }

                // 🧹 Reset form
                setName("");
                setNum("");
                setEditingId(null);
                setCID(categories[0]?.cID ?? null);
            }

            if (dialogType === "delete" && selectedItem) {
                try {
                    await deleteSmsRecipient(db, selectedItem.recipId);
                } catch (err: any) {
                    console.error("Local DB delete failed:", err);
                    setErrorMessage(`Local delete failed: ${err.message || err}`);
                    return;
                }

                try {
                    await deleteSmsRecipientAPI({
                        num: selectedItem.num,
                        cID: selectedItem.cID,
                        name: selectedItem.name,
                    });
                } catch (err: any) {
                    console.warn("API sync failed (delete):", err);
                    setErrorMessage(`API sync failed: ${err.message || err}`);
                }
            }

            setIsOpen(false);
            setSelectedItem(null);
            setDialogType(null);

            loadData();
        } catch (err: any) {
            console.error("Unexpected error:", err);
            setErrorMessage(`Unexpected error: ${err.message || err}`);
        }
    };


    return (
        <SafeAreaView className="flex-1 bg-white" edges={{ top: 'off', bottom: 'off' }}>
            <ScrollView className="flex-1">
                <Box className="flex-1 p-4">
                    <Heading className="mb-4">SMS Recipients</Heading>

                    {/* Form */}
                    <VStack className="gap-2">
                        <Button 
                            variant="outline"
                            onPress={() => setShowContactPicker(true)}
                        >
                            <ButtonText>📱 Import from Contacts</ButtonText>
                        </Button>

                        <Input>
                            <InputField
                                placeholder="Name"
                                value={name}
                                onChangeText={setName}
                            />
                        </Input>

                        <Input>
                            <InputField
                                placeholder="Phone Number"
                                value={num}
                                onChangeText={setNum}
                                keyboardType="phone-pad"
                            />
                        </Input>

                        {/* Category Dropdown */}
                        <Select
                            selectedValue={cID?.toString()}
                            onValueChange={(value) => setCID(Number(value))}
                        >
                            <SelectTrigger>
                                <SelectInput
                                    placeholder="Select Category"
                                    value={
                                        categories.find((c) => c.cID === cID)?.cName || ""
                                    }
                                />
                            </SelectTrigger>

                            <SelectPortal>
                                <SelectBackdrop />
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem
                                            key={cat.cID}
                                            label={cat.cName}
                                            value={cat.cID.toString()}
                                        />
                                    ))}
                                </SelectContent>
                            </SelectPortal>
                        </Select>

                        <Button onPress={confirmSave}>
                            <ButtonText>
                                {editingId ? "Update Recipient" : "Add Recipient"}
                            </ButtonText>
                        </Button>
                    </VStack>

                    {/* List */}
                    <VStack className="mt-6 gap-3">
                        {recipients.map((item) => (
                            <HStack
                                key={item.recipId}
                                className="justify-between items-center border border-gray-200 rounded-lg p-3"
                            >
                                <VStack>
                                    <Text className="font-semibold">
                                        {item.name || "No Name"}
                                    </Text>
                                    <Text className="text-gray-500">
                                        {item.num}
                                    </Text>
                                    <Text className="text-xs text-gray-400">
                                        {item.categoryName}
                                    </Text>
                                </VStack>

                                <HStack className="gap-2">
                                    <Button
                                        size="sm"
                                        onPress={() => handleEdit(item)}
                                    >
                                        <ButtonText>Edit</ButtonText>
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onPress={() => confirmDelete(item)}
                                    >
                                        <ButtonText>Delete</ButtonText>
                                    </Button>
                                </HStack>
                            </HStack>
                        ))}
                    </VStack>
                </Box>
            </ScrollView>
            <AlertDialog isOpen={isOpen} onClose={() => setIsOpen(false)}>
                <AlertDialogBackdrop />
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <Heading size="lg">
                            {dialogType === "delete"
                                ? "Delete Recipient"
                                : editingId
                                    ? "Update Recipient"
                                    : "Add Recipient"}
                        </Heading>
                    </AlertDialogHeader>

                    <AlertDialogBody>
                        {dialogType === "delete" && selectedItem && (
                            <>
                                <Text className="mb-2">
                                    This action cannot be undone. Are you sure you want to delete:
                                </Text>

                                <Box className="bg-gray-100 p-3 rounded-lg">
                                    <Text className="font-semibold">
                                        {selectedItem.name || "No Name"}
                                    </Text>
                                    <Text className="text-gray-600">
                                        {selectedItem.num}
                                    </Text>
                                    <Text className="text-xs text-gray-400">
                                        {selectedItem.categoryName}
                                    </Text>
                                </Box>
                            </>
                        )}

                        {dialogType === "save" && (
                            <>
                                <Text className="mb-2">
                                    Please confirm the following details:
                                </Text>

                                <Box className="bg-gray-100 p-3 rounded-lg">
                                    <Text className="font-semibold">
                                        {name || "No Name"}
                                    </Text>
                                    <Text className="text-gray-600">
                                        {num}
                                    </Text>
                                    <Text className="text-xs text-gray-400">
                                        {
                                            categories.find((c) => c.cID === cID)?.cName ||
                                            "No Category"
                                        }
                                    </Text>
                                </Box>
                            </>
                        )}
                    </AlertDialogBody>

                    <AlertDialogFooter className="gap-2 mt-2">
                        <Button
                            variant="outline"
                            onPress={() => {
                                setIsOpen(false);
                                setDialogType(null);
                                setSelectedItem(null);
                            }}
                        >
                            <ButtonText>Cancel</ButtonText>
                        </Button>

                        <Button
                            action={dialogType === "delete" ? "negative" : "primary"}
                            onPress={handleConfirm}
                        >
                            <ButtonText>
                                {dialogType === "delete" ? "Delete" : "Confirm"}
                            </ButtonText>
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Contact Picker Modal */}
            <ContactPickerModal
                isOpen={showContactPicker}
                onClose={() => setShowContactPicker(false)}
                onSelectContact={handleSelectContact}
            />
            <AlertDialog
                isOpen={!!errorMessage}
                onClose={() => setErrorMessage(null)}
            >
                <AlertDialogBackdrop />
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <Heading size="lg">Operation Failed</Heading>
                    </AlertDialogHeader>
                    <AlertDialogBody>
                        <Text>{errorMessage}</Text>
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <Button onPress={() => setErrorMessage(null)}>
                            <ButtonText>OK</ButtonText>
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </SafeAreaView>
    );
}