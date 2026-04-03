import { AlertDialog, AlertDialogBackdrop, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader } from "@/components/ui/alert-dialog";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

interface SmsLog {
    smsId: number;
    stnId: number;
    uId: number;
    status: string;
    msg: string;
    recip_num: string;
    recip_name?: string;
    category: string;
    dateSent: string;
    channel: string;
    stnName?: string;
    ICAO?: string;
}

interface SmsDetailModalProps {
    visible: boolean;
    sms: SmsLog | null;
    onClose: () => void;
}

export default function SmsDetailModal({ visible, sms, onClose }: SmsDetailModalProps) {
    if (!sms) return null;

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'success':
            case 'sent':
                return 'bg-green-100 text-green-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDateTime = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <AlertDialog isOpen={visible} onClose={onClose}>
            <AlertDialogBackdrop />
            <AlertDialogContent className="max-w-sm">
                <AlertDialogHeader>
                    <Heading size="sm">SMS Details</Heading>
                </AlertDialogHeader>

                <AlertDialogBody>
                    <VStack space="sm">

                        {/* Status + Category */}
                        <Box className="flex flex-row justify-between items-center">
                            <Badge className={`px-2 py-1 rounded-full ${getStatusColor(sms.status)}`}>
                                <BadgeText className="text-xs">
                                    {sms.status}
                                </BadgeText>
                            </Badge>

                            <Text className="text-xs text-gray-600">
                                {sms.category}
                            </Text>
                        </Box>

                        {/* Date */}
                        <Text className="text-xs text-gray-500">
                            {formatDateTime(sms.dateSent)}
                        </Text>

                        {/* Recipient */}
                        <Box>
                            <Text className="text-sm font-medium">
                                {sms.recip_name || "Unknown"}
                            </Text>
                            <Text className="text-xs text-gray-500 font-mono">
                                {sms.recip_num}
                            </Text>
                        </Box>

                        {/* Message */}
                        <Box className="bg-gray-50 p-2 rounded border">
                            <Text className="text-xs whitespace-pre-wrap">
                                {sms.msg}
                            </Text>
                        </Box>

                    </VStack>
                </AlertDialogBody>

                <AlertDialogFooter>
                    <Button onPress={onClose} size="sm" variant="outline">
                        <ButtonText>Close</ButtonText>
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}