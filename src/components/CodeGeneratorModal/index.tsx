import {
    AlertDialog,
    AlertDialogBackdrop,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import {
    FormControl,
    FormControlError,
    FormControlErrorText,
    FormControlHelper,
    FormControlHelperText,
} from "@/components/ui/form-control";
import { Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import generateCodeFromTemplate from "@/src/utils/code_generation";
import { checkSmsExists, getDB, insertLSmsLog } from "@/src/utils/db";
import { getSimCards, sendSms } from "expo-android-sms-sender";
import { Lock, Unlock, X } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { PermissionsAndroid, ScrollView } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

type SimCard = {
    id: number;
    displayName: string;
    carrierName: string;
    slotIndex?: number;
};

interface Category {
    cID: number;
    cName: string;
}

interface CodeGeneratorModalProps {
    visible: boolean;
    onClose: () => void;
    categories: Category[];
    observedData?: Record<string, any>;
    recipients?: string[];
}

export default function CodeGeneratorModal({
    visible,
    onClose,
    observedData = {},
    recipients = [],
}: CodeGeneratorModalProps) {
    // Change activeTab state type
    const [activeTab, setActiveTab] = useState<Category | null>(null);

    // Map category IDs -> names for tabs   
    const categoryKeys = useMemo(() => {
        if (!observedData) return [];

        // Ensure cID is an array of numbers
        let ids: number[] = [];
        if (typeof observedData.cID === "string") {
            ids = observedData.cID.split(",").map((id) => parseInt(id.trim(), 10));
        } else if (Array.isArray(observedData.cID)) {
            ids = observedData.cID.map((id) => Number(id));
        } else if (typeof observedData.cID === "number") {
            ids = [observedData.cID];
        }

        // Ensure category names is an array of strings
        let names: string[] = [];
        if (typeof observedData.category === "string") {
            names = observedData.category.split(",").map((name) => name.trim());
        } else if (Array.isArray(observedData.category)) {
            names = observedData.category.map((name) => String(name));
        }

        // Combine IDs and names
        return ids.map((cID, index) => ({
            cID,
            cName: names[index] || `Category ${cID}`, // fallback name
        }));
    }, [observedData]);

    // Default active tab: store the full object
    useEffect(() => {
        if (categoryKeys.length > 0 && !activeTab) {
            setActiveTab(categoryKeys[0]);
        }
    }, [categoryKeys, activeTab, observedData]);

    // Load code whenever activeTab or observedData changes
    useEffect(() => {
        if (!visible || !activeTab || !observedData || Object.keys(observedData).length === 0) return;

        const loadCode = async () => {
            const db = await getDB();
            const stnID = "1";
            const hour = observedData?.sHour?.slice(0, 2) ?? "00";

            const code = await generateCodeFromTemplate(db, stnID, hour, activeTab, observedData);

            setGeneratedCode(
                code && code.trim().length > 0 ? code : "No generated code available"
            );
        };
        loadCode();
    }, [visible, activeTab, observedData]);

    const defaultGeneratedCode = "";

    const [isOpen, setIsOpen] = useState<boolean>(visible);
    const [generatedCode, setGeneratedCode] = useState<string>(defaultGeneratedCode);
    const [isSending, setIsSending] = useState<boolean>(false);
    const [sendStatus, setSendStatus] = useState<Record<string, string>>({});
    const [hasSentMessages, setHasSentMessages] = useState<boolean>(false);
    const [alreadySentRecipients, setAlreadySentRecipients] = useState<Set<string>>(new Set());

    const [dotCount, setDotCount] = useState(0);

    // Animate ellipsis when sending
    useEffect(() => {
        if (!isSending) return;

        const interval = setInterval(() => {
            setDotCount((prev) => (prev + 1) % 4); // 0 → 1 → 2 → 3 → 0
        }, 500); // change dots every 500ms

        return () => clearInterval(interval);
    }, [isSending]);

    const [editMode, setEditMode] = useState<boolean>(false);

    const textareaRef = useRef<any>(null);

    // Open / close dialog
    useEffect(() => setIsOpen(visible), [visible]);

    // Reset states on close
    const handleClose = () => {
        if (isSending) return; // prevent closing while sending

        setIsOpen(false);
        setEditMode(false);
        setSendStatus({});
        setHasSentMessages(false);
        setAlreadySentRecipients(new Set());
        onClose?.();
    };

    // Autofocus textarea on edit
    useEffect(() => {
        if (editMode && textareaRef.current) {
            setTimeout(() => {
                textareaRef.current?.focus();
            }, 100);
        }
    }, [editMode]);

    // Disable edit mode when messages have been sent
    useEffect(() => {
        if (hasSentMessages && editMode) {
            setEditMode(false);
        }
    }, [hasSentMessages, editMode]);

    // Check for already sent messages
    useEffect(() => {
        const checkExistingSms = async () => {
            if (!visible || !generatedCode || generatedCode === "No generated code available" || !recipients.length) {
                setAlreadySentRecipients(new Set());
                return;
            }

            try {
                const db = await getDB();
                const sentRecipients = new Set<string>();

                const isSynop = activeTab?.cName === 'SYNOP';
                const recordId = isSynop ? observedData?.sID : observedData?.metID;
                const idType = isSynop ? 'sId' : 'metId';

                for (const recipient of recipients) {
                    const exists = await checkSmsExists(db, generatedCode, recipient, "success", recordId, idType);
                    if (exists) {
                        sentRecipients.add(recipient);
                    }
                }

                setAlreadySentRecipients(sentRecipients);
            } catch (error) {
                console.error("Error checking existing SMS:", error);
                setAlreadySentRecipients(new Set());
            }
        };

        checkExistingSms();
    }, [visible, generatedCode, recipients, activeTab, observedData]);

    const sendTxtMsg = async (recipients: string[], bodySMS: string) => {
        if (bodySMS.length > 160) {
            alert("Cannot send code: exceeds 160 characters.");
            return;
        }

        try {
            setIsSending(true);
            const initialStatus: Record<string, string> = {};
            recipients.forEach((num) => (initialStatus[num] = "pending"));
            setSendStatus(initialStatus);

            const phoneStatePermission = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE
            );
            if (phoneStatePermission !== PermissionsAndroid.RESULTS.GRANTED) return;

            const smsPermission = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.SEND_SMS
            );
            if (smsPermission !== PermissionsAndroid.RESULTS.GRANTED) return;

            const sims: SimCard[] = await getSimCards();
            if (!sims?.length) return;
            const simId = sims[0]?.id;

            // Get database connection for logging
            const db = await getDB();
            const stnId = observedData?.stnID || 1; // Get station ID from observed data

            const isSynop = activeTab?.cName === 'SYNOP';
            const recordId = isSynop ? observedData?.sID : observedData?.metID;

            for (const number of recipients) {
                // Skip if already sent
                if (alreadySentRecipients.has(number)) {
                    setSendStatus((prev) => ({ ...prev, [number]: "already_sent" }));
                    continue;
                }

                setSendStatus((prev) => ({ ...prev, [number]: "sending" }));
                if (!bodySMS) {
                    setSendStatus((prev) => ({ ...prev, [number]: "failed" }));
                    // Log failed attempt
                    try {
                        await insertLSmsLog(db, {
                            stnId,
                            sId: isSynop ? recordId : undefined,
                            metId: !isSynop ? recordId : undefined,
                            status: "failed",
                            msg: bodySMS,
                            recip: number,
                            channel: activeTab?.cName,
                        });
                    } catch (logError) {
                        console.error("Error logging failed SMS:", logError);
                    }
                    continue;
                }
                try {
                    await sendSms(number, bodySMS, simId);
                    setSendStatus((prev) => ({ ...prev, [number]: "sent" }));
                    // Log successful send
                    try {
                        await insertLSmsLog(db, {
                            stnId,
                            sId: isSynop ? recordId : undefined,
                            metId: !isSynop ? recordId : undefined,
                            status: "success",
                            msg: bodySMS,
                            recip: number,
                            channel: activeTab?.cName,
                        });
                    } catch (logError) {
                        console.error("Error logging successful SMS:", logError);
                    }
                } catch {
                    try {
                        await sendSms(number, bodySMS);
                        setSendStatus((prev) => ({ ...prev, [number]: "sent" }));
                        // Log successful send (fallback)
                        try {
                            await insertLSmsLog(db, {
                                stnId,
                                sId: isSynop ? recordId : undefined,
                                metId: !isSynop ? recordId : undefined,
                                status: "success",
                                msg: bodySMS,
                                recip: number,
                                channel: activeTab?.cName,
                            });
                        } catch (logError) {
                            console.error("Error logging successful SMS:", logError);
                        }
                    } catch {
                        setSendStatus((prev) => ({ ...prev, [number]: "failed" }));
                        // Log failed attempt
                        try {
                            await insertLSmsLog(db, {
                                stnId,
                                sId: isSynop ? recordId : undefined,
                                metId: !isSynop ? recordId : undefined,
                                status: "failed",
                                msg: bodySMS,
                                recip: number,
                                channel: activeTab?.cName,
                            });
                        } catch (logError) {
                            console.error("Error logging failed SMS:", logError);
                        }
                    }
                }
            }
        } finally {
            setIsSending(false);
            setHasSentMessages(true);
        }
    };

    function formatObservationDate(dateStr: string): string {
        if (!dateStr) return "—";

        // Parse the string into a Date object
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr; // fallback if invalid date

        // Options for formatting
        const options: Intl.DateTimeFormatOptions = {
            year: "numeric",
            month: "long",
            day: "2-digit",
        };

        return date.toLocaleDateString(undefined, options);
    }

    const isPlaceholder = generatedCode === "No generated code available";
    const isTooLong = generatedCode.length > 160;
    const isEmpty = generatedCode.trim().length === 0;
    const isValid = !isEmpty && !isTooLong;

    return (
        <AlertDialog isOpen={isOpen} onClose={isSending ? () => { } : handleClose}>
            <AlertDialogBackdrop />
            <AlertDialogContent className="w-80 max-w-md">
                {/* Header with X */}
                <AlertDialogHeader className="flex-row items-center justify-between">
                    <Text className="text-lg font-semibold">Code SMS</Text>
                    <Pressable
                        onPress={handleClose}
                        disabled={isSending}
                        className={`p-1 rounded-full ${isSending ? "bg-gray-200 opacity-50" : "bg-gray-100"}`}
                    >
                        <X size={18} color="#374151" />
                    </Pressable>
                </AlertDialogHeader>

                <KeyboardAwareScrollView
                    bottomOffset={25}
                    className="max-h-[400px]"
                    keyboardShouldPersistTaps="handled"
                    scrollEnabled={false}
                >
                    <AlertDialogBody className="space-y-4">

                        {/* Horizontal Tabs */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                            <Box className="flex-row gap-2">
                                {categoryKeys.map((category) => (
                                    <Button
                                        key={category.cID}
                                        size="sm"
                                        variant="solid"
                                        className={`px-4 py-2 rounded-lg shadow-sm ${activeTab?.cID === category.cID ? "bg-blue-400" : "bg-gray-200"}`}
                                        onPress={() => setActiveTab(category)}
                                    >
                                        <ButtonText className={`${activeTab?.cID === category.cID ? "text-white font-semibold" : "text-gray-700 font-medium"}`}>
                                            {category.cName}
                                        </ButtonText>
                                    </Button>
                                ))}
                            </Box>
                        </ScrollView>

                        {/* Observation Date & Hour */}
                        {observedData?.sDate && observedData?.sHour && (
                            <Box className="p-3 bg-gray-100 rounded-lg shadow-inner">
                                <Text className="text-sm font-semibold text-gray-800">
                                    {formatObservationDate(observedData.sDate)} at {observedData.sHour.padStart(2, '0')}
                                </Text>
                            </Box>
                        )}

                        {/* Recipients */}
                        {recipients.length > 0 && (
                            <Box className="py-3">
                                <Text className="text-sm font-semibold text-gray-700 mb-1">Recipients</Text>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ flexDirection: 'row', gap: 4 }}
                                >
                                    {recipients.map((r) => {
                                        const status = sendStatus[r] || (alreadySentRecipients.has(r) ? "already_sent" : "pending");

                                        let action: "info" | "success" | "error" | "warning" = "info";

                                        if (status === "sent") action = "success";
                                        else if (status === "failed") action = "error";
                                        else if (status === "sending") action = "warning";
                                        else if (status === "already_sent") action = "success"; // Show as success but indicate it's already sent

                                        return (
                                            <Badge
                                                key={r}
                                                size="sm"
                                                action={action}
                                                className="p-2 rounded"
                                            >
                                                <BadgeText size="sm" italic>
                                                    {status === "already_sent" ? `${r} ✓` : r}
                                                </BadgeText>
                                            </Badge>
                                        );
                                    })}
                                </ScrollView>
                            </Box>
                        )}
                        {/* Generated Code */}
                        <FormControl
                            isInvalid={isTooLong || isEmpty}
                            className="mb-2"
                        >
                            <Textarea
                                isReadOnly={!editMode}
                                className="border border-gray-300 rounded-lg shadow-sm bg-white"
                            >
                                <TextareaInput
                                    ref={textareaRef}
                                    value={generatedCode}
                                    onChangeText={setGeneratedCode}
                                    multiline
                                    editable={editMode}
                                    className={`text-sm p-2 h-32 ${isPlaceholder ? "text-gray-400 italic" : "text-gray-800"
                                        }`}
                                    style={{ textAlignVertical: "top" }}
                                />
                            </Textarea>

                            {/* Character counter */}
                            <FormControlHelper>
                                <FormControlHelperText
                                    className={`text-right ${isTooLong ? "text-red-500" : "text-gray-500"
                                        }`}
                                >
                                    {generatedCode.length}/160 characters
                                </FormControlHelperText>
                            </FormControlHelper>

                            {/* Error messages */}
                            {isEmpty && (
                                <FormControlError>
                                    <FormControlErrorText>
                                        Message cannot be empty.
                                    </FormControlErrorText>
                                </FormControlError>
                            )}

                            {isTooLong && (
                                <FormControlError>
                                    <FormControlErrorText>
                                        SMS must not exceed 160 characters.
                                    </FormControlErrorText>
                                </FormControlError>
                            )}

                            {!isSending && !hasSentMessages && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    action={editMode ? "primary" : "secondary"}
                                    onPress={() => setEditMode((prev) => !prev)}
                                    className="mt-2"
                                >
                                    <Icon as={editMode ? Unlock : Lock} className="mr-2" />
                                    <ButtonText>
                                        {editMode ? "Lock Message" : "Edit Message"}
                                    </ButtonText>
                                </Button>
                            )}
                        </FormControl>
                    </AlertDialogBody>
                </KeyboardAwareScrollView>

                <AlertDialogFooter className="justify-center">
                    {recipients.length > 0 && (
                        <>
                            {isSending ? (
                                <Box className="w-full items-center py-2">
                                    {(() => {
                                        const currentRecipient = recipients.find(
                                            (r) => sendStatus[r] === "sending" || sendStatus[r] === "pending"
                                        );

                                        const fallbackRecipient = recipients.find((r) => sendStatus[r] === "sent" || sendStatus[r] === "failed" || sendStatus[r] === "already_sent");

                                        const displayRecipient = currentRecipient || fallbackRecipient;

                                        let displayText = "";
                                        if (!displayRecipient) displayText = "";
                                        else {
                                            const status = sendStatus[displayRecipient];
                                            if (status === "sending") displayText = `Sending to ${displayRecipient}${".".repeat(dotCount)}`;
                                            else if (status === "sent") displayText = `Sent to ${displayRecipient}`;
                                            else if (status === "failed") displayText = `Failed to send to ${displayRecipient}`;
                                            else if (status === "already_sent") displayText = `Already sent to ${displayRecipient}`;
                                            else displayText = `Pending: ${displayRecipient}`;
                                        }

                                        return (
                                            <Text className="text-center text-gray-700 text-sm font-medium">
                                                {displayText}
                                            </Text>
                                        );
                                    })()}
                                </Box>
                            ) : hasSentMessages ? (
                                <Box className="w-full items-center py-2">
                                    <Text className="text-center text-green-600 text-sm font-medium">
                                        Messages sent and logged to history
                                    </Text>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="mt-2 w-full"
                                        onPress={() => {
                                            setHasSentMessages(false);
                                            setSendStatus({});
                                            setAlreadySentRecipients(new Set());
                                        }}
                                    >
                                        <ButtonText>Send Again</ButtonText>
                                    </Button>
                                </Box>
                            ) : (
                                <Button
                                    size="sm"
                                    className="w-full bg-blue-400 py-3"
                                    onPress={() => sendTxtMsg(recipients, generatedCode)}
                                    disabled={!isValid || editMode || recipients.every(r => alreadySentRecipients.has(r))}
                                >
                                    <ButtonText className="text-white font-semibold text-center">
                                        {recipients.every(r => alreadySentRecipients.has(r)) ? "All Recipients Already Have This Message" : "Send SMS"}
                                    </ButtonText>
                                </Button>
                            )}
                        </>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog >
    );
}