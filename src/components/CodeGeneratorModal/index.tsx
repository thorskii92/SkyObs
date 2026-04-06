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
import { useUser } from "@/src/context/UserContext";
import generateCodeFromTemplate from "@/src/utils/code_generation";
import { checkSmsExists, getDB, insertLSmsLog } from "@/src/utils/db";
import { getSimCards, sendSms } from "expo-android-sms-sender";
import * as Clipboard from 'expo-clipboard';
import { Copy, Lock, Unlock, X } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, PermissionsAndroid, ScrollView } from "react-native";
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
    recipientsByCategory?: Record<string, { num: string; name?: string }[]>;
}

export default function CodeGeneratorModal({
    visible,
    onClose,
    observedData = {},
    recipientsByCategory,
}: CodeGeneratorModalProps) {
    const { user } = useUser();

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
        if (visible && categoryKeys.length > 0) {
            setActiveTab(categoryKeys[0]);
        }
    }, [visible, categoryKeys]);

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
            const stnID = String(user?.station_id);
            const hour = observedData?.sHour?.slice(0, 2) ?? "00";

            const code = await generateCodeFromTemplate(db, stnID, hour, activeTab, observedData);

            setGeneratedCode(
                code && code.trim().length > 0 ? code : "No generated code available"
            );
        };
        loadCode();
        setSendError(null);
    }, [visible, activeTab, observedData]);

    const recipients = useMemo(() => {
        if (!activeTab || !recipientsByCategory) return [];
        return recipientsByCategory[activeTab.cName.toUpperCase()] || [];
    }, [activeTab, recipientsByCategory]);

    const defaultGeneratedCode = "";

    const [isOpen, setIsOpen] = useState<boolean>(visible);
    const [generatedCode, setGeneratedCode] = useState<string>(defaultGeneratedCode);
    const [isSending, setIsSending] = useState<boolean>(false);
    const [sendStatus, setSendStatus] = useState<Record<string, string>>({});
    const [hasSentMessages, setHasSentMessages] = useState<boolean>(false);
    const [sendError, setSendError] = useState<string | null>(null);
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
        setActiveTab(null);
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

    const copyToClipboard = async () => {
        try {
            console.log("Copying to clipboard:", generatedCode);
            await Clipboard.setStringAsync(generatedCode);
        } catch (error) {
            console.error("Failed to copy to clipboard:", error);
            Alert.alert("Error", "Failed to copy code");
        }
    };

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

                for (const r of recipients) {
                    const exists = await checkSmsExists(
                        db,
                        generatedCode,
                        r.num,
                        activeTab?.cName || ""
                    );

                    if (exists) {
                        sentRecipients.add(r.num);
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

    const sendTxtMsg = async (
        recipients: { num: string; name?: string }[],
        bodySMS: string
    ) => {
        if (bodySMS.length > 160) {
            alert("Cannot send code: exceeds 160 characters.");
            return;
        }

        let didProcess = false;

        try {
            setIsSending(true);

            const initialStatus: Record<string, string> = {};
            recipients.forEach((r) => (initialStatus[r.num] = "pending"));
            setSendStatus(initialStatus);

            const phoneStatePermission = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE
            );
            if (phoneStatePermission !== PermissionsAndroid.RESULTS.GRANTED) {
                setSendError("SMS permission denied.");
                return;
            }
            const smsPermission = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.SEND_SMS
            );
            if (smsPermission !== PermissionsAndroid.RESULTS.GRANTED) {
                setSendError("SMS permission denied.");
                return;
            };

            const sims: SimCard[] = await getSimCards();

            if (!sims?.length) {
                const failedStatus: Record<string, string> = {};
                recipients.forEach((r) => (failedStatus[r.num] = "failed"));
                setSendStatus(failedStatus);

                setSendError("No SIM card detected. Cannot send SMS.");
                setHasSentMessages(true); // now UI shows failure state properly
                return;
            }
            const simId = sims[0]?.id;

            const db = await getDB();
            const stnId = observedData?.stnID || 1;

            const category = activeTab?.cName || "UNKNOWN"; // ✅ NEW

            const obsDate = observedData?.sDate; // already YYYY-MM-DD

            // Convert sHour → "HH00"
            const rawHour = observedData?.sHour ?? "00";
            const obsHour =
                rawHour.length === 4
                    ? rawHour // already "HHMM"
                    : rawHour.toString().padStart(2, "0") + "00";

            for (const r of recipients) {
                const number = r.num;

                if (alreadySentRecipients.has(number)) {
                    setSendStatus((prev) => ({ ...prev, [number]: "already_sent" }));
                    continue;
                }

                setSendStatus((prev) => ({ ...prev, [number]: "sending" }));

                if (!bodySMS) {
                    setSendStatus((prev) => ({ ...prev, [number]: "failed" }));

                    await insertLSmsLog(db, {
                        stnId,
                        category,
                        status: "failed",
                        msg: bodySMS,
                        recip_num: number,
                        recip_name: r.name,

                        obsDate,          // ✅ NEW
                        obsHour,          // ✅ NEW

                        channel: category,
                    });

                    continue;
                }

                try {
                    await sendSms(number, bodySMS, simId);

                    setSendStatus((prev) => ({ ...prev, [number]: "sent" }));

                    await insertLSmsLog(db, {
                        stnId,
                        category,
                        status: "success",
                        msg: bodySMS,
                        recip_num: number,
                        recip_name: r.name,

                        obsDate,          // ✅ NEW
                        obsHour,          // ✅ NEW

                        channel: category,
                    });

                } catch {
                    setSendStatus((prev) => ({ ...prev, [number]: "failed" }));

                    await insertLSmsLog(db, {
                        stnId,
                        category,
                        status: "failed",
                        msg: bodySMS,
                        recip_num: number,
                        recip_name: r.name,

                        obsDate,          // ✅ NEW
                        obsHour,          // ✅ NEW

                        channel: category,
                    });
                }
            }

            didProcess = true;
        } finally {
            setIsSending(false);
            if (didProcess) {
                setHasSentMessages(true);
            }
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

    const [selection, setSelection] = useState({ start: 0, end: 0 });

    const isPlaceholder = generatedCode === "No generated code available";
    const isTooLong = generatedCode.length > 160;
    const isEmpty = generatedCode.trim().length === 0;
    const isValid = !isEmpty && !isTooLong;

    const statusValues = Object.values(sendStatus);

    const hasAnySent = statusValues.includes("sent");
    const hasAnyFailed = statusValues.includes("failed");
    const hasAnyPendingOrSending = statusValues.some(
        (s) => s === "pending" || s === "sending"
    );

    const isAllSuccess =
        statusValues.length > 0 &&
        statusValues.every((s) => s === "sent" || s === "already_sent");

    const isAllFailed =
        statusValues.length > 0 &&
        statusValues.every((s) => s === "failed");

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
                                        const status = sendStatus[r.num] || (alreadySentRecipients.has(r.num) ? "already_sent" : "pending");

                                        let action: "info" | "success" | "error" | "warning" = "info";

                                        if (status === "sent") action = "success";
                                        else if (status === "failed") action = "error";
                                        else if (status === "sending") action = "warning";
                                        else if (status === "already_sent") action = "success";

                                        return (
                                            <Badge
                                                key={r.num}
                                                size="sm"
                                                action={action}
                                                className="p-2 rounded"
                                            >
                                                <BadgeText size="sm" italic bold>
                                                    {status === "already_sent"
                                                        ? `${r.name || r.num} ✓`
                                                        : (r.name || r.num)}
                                                </BadgeText>
                                            </Badge>
                                        );
                                    })}
                                </ScrollView>
                            </Box>
                        )}

                        {recipients.length === 0 && (
                            <Box className="p-2 bg-gray-100 rounded-lg my-2">
                                <Text className="text-sm text-gray-400 italic">
                                    No recipients configured for this category.
                                </Text>
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
                                    onChangeText={(text) => setGeneratedCode(text)}
                                    multiline
                                    editable={editMode}
                                    selection={selection}
                                    onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
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

                            {!isSending && (
                                <Box className="flex-row gap-2 mt-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        action={editMode ? "primary" : "secondary"}
                                        onPress={() => setEditMode((prev) => !prev)}
                                        className="flex-1"
                                    >
                                        <Icon as={editMode ? Unlock : Lock} className="mr-2" />
                                        <ButtonText>
                                            {editMode ? "Lock Message" : "Edit Message"}
                                        </ButtonText>
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        action={isPlaceholder ? "secondary" : "primary"}
                                        onPress={copyToClipboard}
                                        className="flex-1"
                                        disabled={isPlaceholder}
                                    >
                                        <Icon as={Copy} className="mr-2" />
                                        <ButtonText>Copy</ButtonText>
                                    </Button>
                                </Box>
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
                                            (r) =>
                                                sendStatus[r.num] === "sending" ||
                                                sendStatus[r.num] === "pending"
                                        );

                                        const fallbackRecipient = recipients.find(
                                            (r) =>
                                                sendStatus[r.num] === "sent" ||
                                                sendStatus[r.num] === "failed" ||
                                                sendStatus[r.num] === "already_sent"
                                        );

                                        const displayRecipient = currentRecipient || fallbackRecipient;

                                        if (!displayRecipient) return null;

                                        const status = sendStatus[displayRecipient.num];
                                        const displayName = displayRecipient.name || displayRecipient.num;

                                        let displayText = "";

                                        if (status === "sending") {
                                            displayText = `Sending to ${displayName}${".".repeat(dotCount)}`;
                                        } else if (status === "sent") {
                                            displayText = `Sent to ${displayName}`;
                                        } else if (status === "failed") {
                                            displayText = `Failed to send to ${displayName}`;
                                        } else if (status === "already_sent") {
                                            displayText = `Already sent to ${displayName}`;
                                        } else {
                                            displayText = `Pending: ${displayName}`;
                                        }

                                        return (
                                            <Text className="text-center text-gray-700 text-sm font-medium">
                                                {displayText}
                                            </Text>
                                        );
                                    })()}
                                </Box>
                            ) : sendError ? (
                                <Box className="w-full items-center py-2">
                                    <Text className="text-center text-sm font-medium text-red-600">
                                        {sendError}
                                    </Text>
                                </Box>
                            ) : hasSentMessages ? (
                                <Box className="w-full items-center py-2">
                                    <Text
                                        className={`text-center text-sm font-medium ${isAllSuccess
                                            ? "text-green-600"
                                            : isAllFailed
                                                ? "text-red-600"
                                                : hasAnyFailed
                                                    ? "text-yellow-600"
                                                    : "text-gray-600"
                                            }`}
                                    >
                                        {isAllSuccess
                                            ? "All messages sent successfully"
                                            : isAllFailed
                                                ? "All messages failed to send"
                                                : hasAnyFailed
                                                    ? "Some messages failed to send"
                                                    : "Processing complete"}
                                    </Text>

                                    {hasAnyFailed && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="mt-2 w-full"
                                            onPress={() => {
                                                const failedRecipients = recipients.filter(
                                                    (r) => sendStatus[r.num] === "failed"
                                                );

                                                setHasSentMessages(false);
                                                setSendStatus({});
                                                setAlreadySentRecipients(new Set());

                                                sendTxtMsg(failedRecipients, generatedCode);
                                            }}
                                        >
                                            <ButtonText>
                                                {isAllFailed ? "Retry All" : "Retry Failed"}
                                            </ButtonText>
                                        </Button>
                                    )}
                                </Box>
                            ) : (
                                <Button
                                    size="sm"
                                    className="w-full bg-blue-400 py-3"
                                    onPress={() => sendTxtMsg(recipients, generatedCode)}
                                    disabled={!isValid || editMode || recipients.every(r => alreadySentRecipients.has(r.num))}
                                >
                                    <ButtonText className="text-white font-semibold text-center">
                                        {recipients.every(r => alreadySentRecipients.has(r.num)) ? "All Recipients Already Have This Message" : "Send SMS"}
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