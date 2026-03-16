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
    recip: string;
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
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <Heading size="md">SMS Details</Heading>
                </AlertDialogHeader>

                <AlertDialogBody>
                    <VStack space="md">
                        <Box>
                            <Text className="font-medium text-gray-600 mb-1">Status</Text>
                            <Badge className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(sms.status)}`}>
                                <BadgeText>{sms.status}</BadgeText>
                            </Badge>
                        </Box>

                        <Box>
                            <Text className="font-medium text-gray-600 mb-1">Date Sent</Text>
                            <Text className="text-sm">{formatDateTime(sms.dateSent)}</Text>
                        </Box>

                        <Box>
                            <Text className="font-medium text-gray-600 mb-1">Recipient</Text>
                            <Text className="text-sm">{sms.recip}</Text>
                        </Box>

                        <Box>
                            <Text className="font-medium text-gray-600 mb-1">Station</Text>
                            <Text className="text-sm">
                                {sms.stnName || sms.ICAO || `Station ${sms.stnId}`}
                            </Text>
                        </Box>

                        <Box>
                            <Text className="font-medium text-gray-600 mb-1">Channel</Text>
                            <Text className="text-sm">{sms.channel}</Text>
                        </Box>

                        <Box>
                            <Text className="font-medium text-gray-600 mb-1">Message</Text>
                            <Box className="bg-gray-50 p-3 rounded border">
                                <Text className="text-sm whitespace-pre-wrap">{sms.msg}</Text>
                            </Box>
                        </Box>

                        <Box>
                            <Text className="font-medium text-gray-600 mb-1">Message Length</Text>
                            <Text className="text-sm">{sms.msg.length} characters</Text>
                        </Box>
                    </VStack>
                </AlertDialogBody>

                <AlertDialogFooter>
                    <Button onPress={onClose} variant="outline">
                        <ButtonText>Close</ButtonText>
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}