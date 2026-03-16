import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { CalendarDaysIcon, Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useCallback, useEffect, useState } from "react";
import { RefreshControl } from 'react-native';

import CodeGeneratorModal from '@/src/components/CodeGeneratorModal';
import LatestObservationCard from '@/src/components/home/LatestObservationCard';
import RecentObservationsTable from '@/src/components/home/RecentObservationsTable';
import { checkSmsSentForCategory, getDB, getLObservedData } from '@/src/utils/db';
import { formatDate } from '@/src/utils/formatters';
import { router } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

const formatNumber = (value: number | null | undefined, unit?: string) => {
  if (value === null || value === undefined) return "—";
  return unit ? `${value.toFixed(1)}${unit}` : value.toFixed(1);
};

export default function Home() {
  const [station, setStation] = useState<string | undefined>();
  const [date, setDate] = useState<Date>(new Date());
  const [synopData, setSynopData] = useState<any[]>([]);
  const [codeCategories, setCodeCategories] = useState<any[]>(["SYNOP", "METAR"]);
  const [selectedRowData, setSelectedRowData] = useState<any>(null);
  const [showCodeGeneratorModal, setShowCodeGeneratorModal] = useState(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [codeType, setCodeType] = useState<string>("");
  const [metarCode, setMetarCode] = useState<string>("Your device has been compromised. Joke lang :P - SkyObs Dev Team");
  const [synopCode, setSynopCode] = useState<string>("Hi! This was sent directly from SkyObs application. Please ignore this message. Thank you.");

  const metarRecip = ["09928914218", "09489421798"];
  const synopRecip = ["09123632321", "09928914218", "09469283039", "09398224209"];

  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<Record<string, string>>({});

  const fetchSynopDataByDate = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const db = await getDB();
      const stnID = "1";

      // 1. Get local data immediately
      let results = await getLObservedData(db, stnID, undefined, formatDate(date));

      // Add SMS sent status for each observation
      const updatedResults = await Promise.all(results.map(async (item) => {
        const smsMetarSent = await checkSmsSentForCategory(db, item.metID, 'metId', 'METAR');
        const smsSynopSent = await checkSmsSentForCategory(db, item.sID, 'sId', 'SYNOP');
        const smsSpeciSent = await checkSmsSentForCategory(db, item.metID, 'metId', 'SPECI');
        return { ...item, smsMetarSent, smsSynopSent, smsSpeciSent };
      }));

      console.log(updatedResults);

      setSynopData(updatedResults.sort((a, b) => Number(b.sHour) - Number(a.sHour)));
      // 2. Try API refresh if connected
    } catch (error) {
      console.error("Error fetching synoptic data:", error);
      setSynopData([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [date]);

  useEffect(() => {
    fetchSynopDataByDate();
  }, [fetchSynopDataByDate]);

  const onRefresh = useCallback(() => {
    fetchSynopDataByDate(true);
  }, [fetchSynopDataByDate]);

  const showDatePicker = () => {
    const nowUtc = new Date(Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate()
    ));

    DateTimePickerAndroid.open({
      value: date,           // must be a Date object
      maximumDate: nowUtc,
      onChange: (event, selectedDate) => {
        if (selectedDate) {
          setDate(selectedDate); // update state with Date
        }
      },
      mode: 'date',
      is24Hour: true,
    });
  };

  const handleOpenCodeGenerator = (row: any) => {
    setSelectedRowData(row);
    setShowCodeGeneratorModal(true);
  };

  const handleNavigateToViewScreen = (row: any) => {
    router.push({
      pathname: '/view',
      params: {
        stationId: row?.stnID,
        date: row?.sDate,
        time: row?.sHour,
      }
    });
  }

  const handleNavigateToEditScreen = (row: any) => {
    router.push({
      pathname: "/review",
      params: {
        stationId: row?.stnID,
        stationName: row?.stnName,
        mslCor: row?.mslCor,
        altCor: row?.altCor,
        date: row?.sDate,
        time: row?.sHour,
        status: "recorded",
      }
    });
  }


  return (
    <SafeAreaView className="flex-1 bg-white" edges={{ top: 'off', bottom: 'off' }}>
      <KeyboardAwareScrollView 
        className="flex-1" 
        automaticallyAdjustKeyboardInsets 
        bottomOffset={10}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Box className="flex-1 p-4">
          <Heading>Dashboard</Heading>
          <Text>Manage weather observations and generate reports.</Text>

          <Box className="flex flex-row items-center gap-2 mb-4 mt-2 bg-white shadow-2xl overflow-hidden border rounded-xl border-gray-300">
            <Pressable className="flex flex-row p-2 items-center w-full gap-2" onPress={showDatePicker}>
              <Icon as={CalendarDaysIcon} className="block text-gray-400" />
              <Text className="block font-bold text-gray-400">
                {formatDate(date)}
              </Text>
            </Pressable>
          </Box>

          {new Date().toDateString() === date.toDateString() && synopData.length > 0 && !isLoading && (
            <LatestObservationCard
              observation={synopData[0]}
              onGenerateCode={() => handleOpenCodeGenerator(synopData[0])}
              onNavigateViewScreen={() => handleNavigateToViewScreen(synopData[0])}
              onNavigateEditScreen={() => handleNavigateToEditScreen(synopData[0])}
            />
          )}

          <RecentObservationsTable
            synopData={synopData}
            isLoading={isLoading}
            onGenerateCode={handleOpenCodeGenerator}
            onView={handleNavigateToViewScreen}
            onEdit={handleNavigateToEditScreen}
          />

          <CodeGeneratorModal
            visible={showCodeGeneratorModal}
            onClose={() => setShowCodeGeneratorModal(false)}
            categories={codeCategories}
            recipients={synopRecip}
            observedData={selectedRowData}
          />
        </Box>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
