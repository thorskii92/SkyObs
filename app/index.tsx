import { AlertDialog, AlertDialogBackdrop, AlertDialogBody, AlertDialogContent, AlertDialogHeader } from '@/components/ui/alert-dialog';
import { Box } from '@/components/ui/box';
import { Button, ButtonGroup, ButtonText } from '@/components/ui/button';
import { Fab, FabIcon, FabLabel } from '@/components/ui/fab';
import { Heading } from '@/components/ui/heading';
import { AddIcon, CalendarDaysIcon, Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import {
  Table,
  TableBody,
  TableCaption,
  TableData,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Text } from '@/components/ui/text';
import { Textarea, TextareaInput } from '@/components/ui/textarea';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useEffect, useState } from "react";

import { getDB, getLSynopData } from '@/src/utils/db';
import { getSimCards, sendSms } from "expo-android-sms-sender";
import { PermissionsAndroid } from 'react-native';

type SimCard = {
  id: number;          // Unique SIM card identifier (subscription ID)
  displayName: string; // SIM name as displayed in system settings
  carrierName: string; // Mobile network carrier name
  slotIndex?: number;  // Slot index (if available)
};

export default function Home() {
  const [station, setStation] = useState<string | undefined>();
  const [date, setDate] = useState<string>("2025-08-01");
  const [synopData, setSynopData] = useState<any[]>([]);
  const [showCodeOptionsDialog, setShowCodeOptionsDialog] = useState(false);
  const [showSendCodeDialog, setShowSendCodeDialog] = useState(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [codeType, setCodeType] = useState<string>("");
  const [metarCode, setMetarCode] = useState<string>("Your device has been compromised. Joke lang :P - SkyObs Dev Team");
  const [synopCode, setSynopCode] = useState<string>("Hi! This was sent directly from SkyObs application. Please ignore this message. Thank you.");

  const metarRecip = ["09928914218", "09489421798"];
  const synopRecip = ["09928914218", "09469283039"];

  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchSynopDataByDate = async () => {
      setIsLoading(true);

      try {
        const db = await getDB();
        const stnID = "1";

        // 1. Get local data immediately
        let results = await getLSynopData(db, stnID, undefined, date);
        console.log(results);
        setSynopData(results);
        // 2. Try API refresh if connected
      } catch (error) {
        console.error("Error fetching synoptic data:", error);
        setSynopData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSynopDataByDate();
  }, [date]);

  const sendTxtMsg = async (recipients: string[], bodySMS: string) => {
    try {
      setIsSending(true);

      // Initialize all recipients as pending
      const initialStatus: Record<string, string> = {};
      recipients.forEach((num) => {
        initialStatus[num] = "pending";
      });
      setSendStatus(initialStatus);

      const phoneStatePermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE
      );

      if (phoneStatePermission !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log("READ_PHONE_STATE permission denied");
        setIsSending(false);
        return;
      }

      const sims: SimCard[] = await getSimCards();
      if (!sims?.length) {
        console.log("No SIM cards available");
        setIsSending(false);
        return;
      }

      const smsPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.SEND_SMS
      );

      if (smsPermission !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log("SEND_SMS permission denied");
        setIsSending(false);
        return;
      }

      const simId = sims[1]?.id ?? sims[0].id;

      // Sequential send with live update
      for (const number of recipients) {
        setSendStatus((prev) => ({
          ...prev,
          [number]: "sending",
        }));

        try {
          await sendSms(number, bodySMS, simId);

          setSendStatus((prev) => ({
            ...prev,
            [number]: "sent",
          }));
        } catch (err) {
          setSendStatus((prev) => ({
            ...prev,
            [number]: "failed",
          }));
        }
      }

    } catch (error) {
      console.error("Error sending SMS:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleCloseShowCodeOptionsDialog = () => {
    setShowCodeOptionsDialog(false);
  }

  const handleCloseSendCodeDialog = () => {
    setShowSendCodeDialog(false);
  }

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

  const navigateToDateTimeScreen = () => {
    router.push('/datetime');
  };

  return (
    <Box className="flex-1 gap-4 p-4">
      <Box className="flex flex-row items-center gap-2 mb-8">
        <Text className='text-lg font-semibold'>Date:</Text>
        <Pressable className="flex flex-row border rounded py-2 px-8 items-center" onPress={showDatePicker}>
          <Text className="block font-bold">
            {date}
          </Text>
          <Icon as={CalendarDaysIcon} className="block ml-2" />
        </Pressable>
        <ButtonGroup>
          <Button className="rounded border">
            <ButtonText className='text-md'>Load</ButtonText>
          </Button>
        </ButtonGroup>
      </Box>

      <ButtonGroup className="flex-row justify-left gap-2">
        <Button className="rounded border w-sm" isDisabled={true}>
          <ButtonText className='text-md'>View</ButtonText>
        </Button>
        <Button className="rounded border" onPress={() => setShowCodeOptionsDialog(true)}>
          <ButtonText className='text-md text-center'>Generate Code</ButtonText>
        </Button>
      </ButtonGroup>

      <Box className='border border-outline-100 w-full rounded-lg overflow-hidden'>
        <Table className="w-full">
          <TableHeader>
            <TableRow className='bg-background-50'>
              <TableHead className='text-sm p-4 border-0 border-r border-solid border-outline-200 font-medium'>Hour</TableHead>
              <TableHead className='text-sm p-4'>Temp</TableHead>
              <TableHead className='text-sm p-4'>RH</TableHead>
              <TableHead className='text-sm p-4'>STMP</TableHead>
              <TableHead className='text-sm p-4'>MSLP</TableHead>
              <TableHead className='text-sm p-4'>Sig</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableData className='text-sm leading-6 p-4 bg-background-50 border-0 border-solid border-r border-outline-200'>0000</TableData>
              <TableData className='text-sm leading-6 p-4'>244°C</TableData>
              <TableData className='text-sm leading-6 p-4'>76</TableData>
              <TableData className='text-sm leading-6 p-4'>76</TableData>
              <TableData className='text-sm leading-6 p-4'>0124</TableData>
              <TableData className='text-sm leading-6 p-4'>NI</TableData>
            </TableRow>
            <TableRow>
              <TableData className='text-sm leading-6 p-4 bg-background-50 border-0 border-solid border-r border-outline-200'>0100</TableData>
              <TableData className='text-sm leading-6 p-4'>253°C</TableData>
              <TableData className='text-sm leading-6 p-4'>80</TableData>
              <TableData className='text-sm leading-6 p-4'>80</TableData>
              <TableData className='text-sm leading-6 p-4'>0105</TableData>
              <TableData className='text-sm leading-6 p-4'>NI</TableData>
            </TableRow>
            <TableRow>
              <TableData className='text-sm leading-6 p-4 bg-background-50 border-0 border-solid border-r border-outline-200'>0200</TableData>
              <TableData className='text-sm leading-6 p-4'>253°C</TableData>
              <TableData className='text-sm leading-6 p-4'>80</TableData>
              <TableData className='text-sm leading-6 p-4'>80</TableData>
              <TableData className='text-sm leading-6 p-4'>0105</TableData>
              <TableData className='text-sm leading-6 p-4'>TMT</TableData>
            </TableRow>
            <TableRow>
              <TableData className='text-sm leading-6 p-4 bg-background-50 border-0 border-solid border-r border-outline-200'>0300</TableData>
              <TableData className='text-sm leading-6 p-4'>253°C</TableData>
              <TableData className='text-sm leading-6 p-4'>80</TableData>
              <TableData className='text-sm leading-6 p-4'>80</TableData>
              <TableData className='text-sm leading-6 p-4'>0105</TableData>
              <TableData className='text-sm leading-6 p-4'>TMT</TableData>
            </TableRow>
          </TableBody>
          <TableCaption className='text-sm'>
            <Text className='text-sm'>
              Observation Data as of {new Date().toUTCString()}
            </Text>
          </TableCaption>
        </Table>
      </Box>

      <Fab
        placement="bottom right"
        isHovered={false}
        isDisabled={false}
        isPressed={false}
        size="lg"
        className="bg-primary-600 hover:bg-primary-700 active:bg-primary-800 mb-14"
        onPress={navigateToDateTimeScreen}
      >
        <FabIcon as={AddIcon} />
        <FabLabel className='font-semibold'>Add Observation</FabLabel>
      </Fab>


      {/* Code Options Dialog */}
      <AlertDialog isOpen={showCodeOptionsDialog} onClose={handleCloseShowCodeOptionsDialog} size="md">
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogHeader>
            <Heading className="text-typography-950 font-semibold" size="md">
              Please Select One
            </Heading>
          </AlertDialogHeader>

          <AlertDialogBody className="flex flex-col mt-3 gap-2">
            <Button className='mb-2' onPress={() => {
              setCodeType("METAR");
              handleCloseShowCodeOptionsDialog();
              setShowSendCodeDialog(true);
            }}
            >
              <ButtonText>
                METAR
              </ButtonText>
            </Button>

            <Button onPress={() => {
              setCodeType("SYNOP");
              handleCloseShowCodeOptionsDialog();
              setShowSendCodeDialog(true);
            }}>
              <ButtonText>
                SYNOP
              </ButtonText>
            </Button>
          </AlertDialogBody>
        </AlertDialogContent>
      </AlertDialog>

      {/*  Send Code Dialog */}
      <AlertDialog isOpen={showSendCodeDialog} onClose={handleCloseSendCodeDialog} size="md">
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogHeader>
            <Heading className="text-typography-950 font-semibold text-center" size="md">
              Sending {codeType} Code
            </Heading>
          </AlertDialogHeader>

          <AlertDialogBody className="flex flex-col mt-3 gap-2">
            <Box className="mb-3 gap-2">
              {(codeType === "METAR" ? metarRecip : synopRecip).map((num) => {
                const status = sendStatus[num] ?? "pending";

                let colorClass = "bg-gray-100 text-gray-500"; // pending default

                if (status === "sending") {
                  colorClass = "bg-amber-100 text-amber-700";
                }

                if (status === "sent") {
                  colorClass = "bg-blue-100 text-blue-700";
                }

                if (status === "failed") {
                  colorClass = "bg-red-100 text-red-700";
                }

                return (
                  <Box
                    key={num}
                    className={`px-3 py-2 rounded-md ${colorClass}`}
                  >
                    <Text className="font-medium">
                      {num}
                    </Text>
                  </Box>
                );
              })}
            </Box>

            <Textarea>
              <TextareaInput
                defaultValue={codeType === "METAR" ? metarCode : synopCode}
                onChangeText={(text) => {
                  if (codeType === "METAR") setMetarCode(text);
                  else setSynopCode(text);
                }}
              />
            </Textarea>

            <Box className="flex flex-row justify-end gap-2 mt-4">
              <Button
                action="secondary"
                isDisabled={isSending}
                onPress={handleCloseSendCodeDialog}
              >
                <ButtonText>
                  Cancel
                </ButtonText>
              </Button>

              <Button
                action="positive"
                isDisabled={isSending}
                onPress={async () => {
                  await sendTxtMsg(
                    codeType === "METAR" ? metarRecip : synopRecip,
                    codeType === "METAR" ? metarCode : synopCode
                  );
                }}
              >
                <ButtonText>
                  {isSending ? "Sending..." : "Send"}
                </ButtonText>
              </Button>
            </Box>
          </AlertDialogBody>
        </AlertDialogContent>
      </AlertDialog>
    </Box>
  );
}
