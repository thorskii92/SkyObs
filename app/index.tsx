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
import { useState } from "react";

export default function Home() {
  const [date, setDate] = useState<String>(new Date().toLocaleDateString());
  const [showCodeOptionsDialog, setShowCodeOptionsDialog] = useState(false);
  const [showSendCodeDialog, setShowSendCodeDialog] = useState(false);

  const [codeType, setCodeType] = useState<string>("");
  const [metarCode, setMetarCode] = useState<string>("dsfs 23421 341234 3241");
  const [synopCode, setSynopCode] = useState<string>("oijjdf 23421 41234 3124");


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
      <Box className="flex flex-row items-center gap-2">
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
              <Button action='secondary' onPress={() => {
                handleCloseSendCodeDialog();
              }}
              >
                <ButtonText>
                  Cancel
                </ButtonText>
              </Button>

              <Button action='positive' onPress={() => {
                handleCloseSendCodeDialog();
              }}>
                <ButtonText>
                  Send
                </ButtonText>
              </Button>
            </Box>
          </AlertDialogBody>
        </AlertDialogContent>
      </AlertDialog>
    </Box>
  );
}
