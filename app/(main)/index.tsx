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
import { useOnlineStatus } from '@/src/context/IsOnlineContext';
import { useUser } from '@/src/context/UserContext';
import { checkSmsSentForCategory, getDB, getLObservedData, getLSmsRecipients } from '@/src/utils/db';
import { formatDate } from '@/src/utils/formatters';
import { router } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

type Recipient = {
  num: string;
  name?: string;
};

const formatNumber = (value: number | null | undefined, unit?: string) => {
  if (value === null || value === undefined) return "—";
  return unit ? `${value.toFixed(1)}${unit}` : value.toFixed(1);
};

export default function Home() {
  const { user } = useUser();
  const [station, setStation] = useState<string | undefined>();
  const [date, setDate] = useState<Date>(new Date());
  const [synopData, setSynopData] = useState<any[]>([]);
  const [codeCategories, setCodeCategories] = useState<any[]>(["SYNOP", "METAR"]);
  const [selectedRowData, setSelectedRowData] = useState<any>(null);
  const [showCodeGeneratorModal, setShowCodeGeneratorModal] = useState(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [recipientsByCategory, setRecipientsByCategory] = useState<Record<string, Recipient[]>>({});
  const { isOnline, refreshConnection } = useOnlineStatus();
  const fetchSynopDataByDate = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const db = await getDB();
      const stnID = user?.station_id;

      // 1️⃣ Get local observed data
      let results = await getLObservedData(
        db,
        stnID ?? "",
        undefined,
        formatDate(date)
      );

      // 2️⃣ Check SMS status per category (simplified)
      const smsSynopSent = await checkSmsSentForCategory(db, "SYNOP");
      const smsMetarSent = await checkSmsSentForCategory(db, "METAR");
      const smsSpeciSent = await checkSmsSentForCategory(db, "SPECI");

      const updatedResults = results.map((item) => ({
        ...item,
        sDate: item?.sDate
          ? new Date(item.sDate).toISOString().split("T")[0]
          : item?.sDate,
        smsSynopSent,
        smsMetarSent,
        smsSpeciSent,
      }));

      setSynopData(
        updatedResults.sort((a, b) => Number(b.sHour) - Number(a.sHour))
      );

      // 3️⃣ Load recipients grouped by category
      const recipients = await getLSmsRecipients(db, { stnId: String(stnID) });

      const grouped: Record<string, Recipient[]> = {};

      recipients.forEach((r) => {
        const key = (r.categoryName || "UNCATEGORIZED").toUpperCase();

        if (!grouped[key]) grouped[key] = [];

        grouped[key].push({
          num: r.num,
          name: r.name,
        });
      });

      setRecipientsByCategory(grouped);

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

  const onRefresh = useCallback(async () => {
    await refreshConnection();
    await fetchSynopDataByDate(true);
  }, [fetchSynopDataByDate, refreshConnection]);

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
        date: new Date(row?.sDate).toISOString().split("T")[0],
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
        date: new Date(row?.sDate).toISOString().split("T")[0],
        time: row?.sHour,
        status: "recorded",
      }
    });
  }

  const handleSignin = () => {
    router.push("/login");
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

          {!user ? (
            <Box className="flex-1 justify-center items-center mt-10 gap-4 bg-gray-100 p-6 rounded-xl">
              <Text className="text-gray-600 text-center text-sm">
                You must sign in to view and manage your assigned station observations.
              </Text>

              <Pressable
                onPress={handleSignin}
                className="bg-blue-400 px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-bold">Sign In</Text>
              </Pressable>
            </Box>
          ) : (
            <>
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
                recipientsByCategory={recipientsByCategory}
                observedData={selectedRowData}
              />
            </>
          )}
        </Box>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
