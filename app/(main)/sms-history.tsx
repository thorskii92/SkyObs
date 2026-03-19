import { Badge, BadgeText } from "@/components/ui/badge";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { FormControl, FormControlLabel, FormControlLabelText } from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { Input, InputField } from "@/components/ui/input";
import { Select, SelectBackdrop, SelectContent, SelectDragIndicator, SelectDragIndicatorWrapper, SelectIcon, SelectInput, SelectItem, SelectPortal, SelectTrigger } from "@/components/ui/select";
import { TableData, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { ChevronDownIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, FlatList, Pressable, RefreshControl, ScrollView } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

import { Divider } from "@/components/ui/divider";
import { Icon } from "@/components/ui/icon";
import SmsDetailModal from "@/src/components/SmsDetailModal";
import { getDB, getLSmsLogs, insertLSmsLog, testSmsLogsTable } from "@/src/utils/db";
import { formatDate } from "@/src/utils/formatters";

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

export default function SmsHistoryScreen() {
    const [smsLogs, setSmsLogs] = useState<SmsLog[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSms, setSelectedSms] = useState<SmsLog | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [recipientFilter, setRecipientFilter] = useState<string>("");
    const [dateFrom, setDateFrom] = useState<Date | null>(null);
    const [dateTo, setDateTo] = useState<Date | null>(null);
    const [sortBy, setSortBy] = useState<string>("dateSent");
    const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const fetchSmsLogs = async () => {
        setIsLoading(true);
        try {
            const db = await getDB();

            // Test the SMS logs table
            await testSmsLogsTable(db);

            const offset = (currentPage - 1) * pageSize;
            const filters = {
                status: statusFilter || undefined,
                recip: recipientFilter || undefined,
                dateFrom: dateFrom ? formatDate(dateFrom) : undefined,
                dateTo: dateTo ? formatDate(dateTo) : undefined,
                limit: pageSize,
                offset: offset,
            };
            const result = await getLSmsLogs(db, filters, sortBy, sortOrder);
            setSmsLogs(result.data);
            setTotalItems(result.total);
            setTotalPages(Math.ceil(result.total / pageSize));
        } catch (error) {
            console.error("Error fetching SMS logs:", error);
            Alert.alert("Error", "Failed to load SMS history");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, recipientFilter, dateFrom, dateTo, sortBy, sortOrder]);

    useEffect(() => {
        fetchSmsLogs();
    }, [statusFilter, recipientFilter, dateFrom, dateTo, sortBy, sortOrder, currentPage, pageSize]);

    const showDatePicker = (type: 'from' | 'to') => {
        const currentDate = type === 'from' ? dateFrom : dateTo;
        DateTimePickerAndroid.open({
            value: currentDate || new Date(),
            onChange: (event, selectedDate) => {
                if (selectedDate) {
                    if (type === 'from') {
                        setDateFrom(selectedDate);
                    } else {
                        setDateTo(selectedDate);
                    }
                }
            },
            mode: 'date',
            is24Hour: true,
        });
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchSmsLogs();
        setRefreshing(false);
    };

    const handleViewDetails = (sms: SmsLog) => {
        setSelectedSms(sms);
        setShowDetailModal(true);
    };

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
                month: 'short',
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

    const [showFilters, setShowFilters] = useState(true);

    const clearFilters = async () => {
        setStatusFilter("");
        setRecipientFilter("");
        setDateFrom(null);
        setDateTo(null);
        setSortBy("dateSent");
        setSortOrder("DESC");
        setCurrentPage(1);
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={{ top: 'off', bottom: 'off' }}>
            <ScrollView
                className="flex-1"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <Box className="p-4">
                    <Box className="flex-row items-center justify-between mb-4">
                        <Box>
                            <Heading>SMS History</Heading>
                            <Text className="text-sm text-gray-500 mt-1">
                                View, filter, and manage all sent SMS records
                            </Text>
                        </Box>
                    </Box>

                    {/* Filters */}
                    <VStack space="md" className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <Pressable className="flex-row items-center justify-between" onPress={() => setShowFilters(prev => !prev)}>
                            <Heading size="sm">Filters & Sorting</Heading>

                            <Icon
                                as={ChevronDownIcon}
                                className={showFilters ? "rotate-180" : "rotate-0"}
                            />
                        </Pressable>

                        {showFilters && (
                            <>
                                {/* Divider */}
                                <Divider className="mb-2" />

                                <Box className="flex-row gap-2">
                                    <FormControl className="flex-1">
                                        <FormControlLabel>
                                            <FormControlLabelText>Status</FormControlLabelText>
                                        </FormControlLabel>
                                        <Select
                                            selectedValue={statusFilter}
                                            onValueChange={setStatusFilter}
                                        >
                                            <SelectTrigger>
                                                <SelectInput placeholder="All Statuses" />
                                                <SelectIcon as={ChevronDownIcon} />
                                            </SelectTrigger>
                                            <SelectPortal>
                                                <SelectBackdrop />
                                                <SelectContent>
                                                    <SelectDragIndicatorWrapper>
                                                        <SelectDragIndicator />
                                                    </SelectDragIndicatorWrapper>
                                                    <SelectItem label="All Statuses" value="" />
                                                    <SelectItem label="Success" value="success" />
                                                    <SelectItem label="Failed" value="failed" />
                                                    <SelectItem label="Pending" value="pending" />
                                                    <SelectItem label="Sent" value="sent" />
                                                </SelectContent>
                                            </SelectPortal>
                                        </Select>
                                    </FormControl>

                                    <FormControl className="flex-1">
                                        <FormControlLabel>
                                            <FormControlLabelText>Sort By</FormControlLabelText>
                                        </FormControlLabel>
                                        <Select
                                            selectedValue={sortBy}
                                            onValueChange={setSortBy}
                                        >
                                            <SelectTrigger>
                                                <SelectInput />
                                                <SelectIcon as={ChevronDownIcon} />
                                            </SelectTrigger>
                                            <SelectPortal>
                                                <SelectBackdrop />
                                                <SelectContent>
                                                    <SelectDragIndicatorWrapper>
                                                        <SelectDragIndicator />
                                                    </SelectDragIndicatorWrapper>
                                                    <SelectItem label="Date Sent" value="dateSent" />
                                                    <SelectItem label="Status" value="status" />
                                                    <SelectItem label="Recipient" value="recip" />
                                                    <SelectItem label="Station" value="stnId" />
                                                </SelectContent>
                                            </SelectPortal>
                                        </Select>
                                    </FormControl>
                                </Box>

                                <Box className="flex-row gap-2">
                                    <FormControl className="flex-1">
                                        <FormControlLabel>
                                            <FormControlLabelText>Recipient</FormControlLabelText>
                                        </FormControlLabel>
                                        <Input>
                                            <InputField
                                                placeholder="Search recipient..."
                                                value={recipientFilter}
                                                onChangeText={setRecipientFilter}
                                            />
                                        </Input>
                                    </FormControl>

                                    <FormControl className="flex-1">
                                        <FormControlLabel>
                                            <FormControlLabelText>Order</FormControlLabelText>
                                        </FormControlLabel>
                                        <Select
                                            selectedValue={sortOrder}
                                            onValueChange={(value) => setSortOrder(value as "ASC" | "DESC")}
                                        >
                                            <SelectTrigger>
                                                <SelectInput />
                                                <SelectIcon as={ChevronDownIcon} />
                                            </SelectTrigger>
                                            <SelectPortal>
                                                <SelectBackdrop />
                                                <SelectContent>
                                                    <SelectDragIndicatorWrapper>
                                                        <SelectDragIndicator />
                                                    </SelectDragIndicatorWrapper>
                                                    <SelectItem label="Descending" value="DESC" />
                                                    <SelectItem label="Ascending" value="ASC" />
                                                </SelectContent>
                                            </SelectPortal>
                                        </Select>
                                    </FormControl>
                                </Box>

                                <Box className="flex-row gap-2">
                                    <FormControl className="flex-1">
                                        <FormControlLabel>
                                            <FormControlLabelText>From Date</FormControlLabelText>
                                        </FormControlLabel>
                                        <Pressable
                                            className="border border-gray-300 rounded px-3 py-2 bg-white"
                                            onPress={() => showDatePicker('from')}
                                        >
                                            <Text className="text-sm">
                                                {dateFrom ? formatDate(dateFrom) : "Select date"}
                                            </Text>
                                        </Pressable>
                                    </FormControl>

                                    <FormControl className="flex-1">
                                        <FormControlLabel>
                                            <FormControlLabelText>To Date</FormControlLabelText>
                                        </FormControlLabel>
                                        <Pressable
                                            className="border border-gray-300 rounded px-3 py-2 bg-white"
                                            onPress={() => showDatePicker('to')}
                                        >
                                            <Text className="text-sm">
                                                {dateTo ? formatDate(dateTo) : "Select date"}
                                            </Text>
                                        </Pressable>
                                    </FormControl>
                                </Box>

                                <Box className="flex-row gap-2">
                                    <FormControl className="flex-1">
                                        <FormControlLabel>
                                            <FormControlLabelText>Page Size</FormControlLabelText>
                                        </FormControlLabel>
                                        <Select
                                            selectedValue={pageSize.toString()}
                                            onValueChange={(value) => {
                                                setPageSize(Number(value));
                                                setCurrentPage(1); // Reset to first page when changing page size
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectInput />
                                                <SelectIcon as={ChevronDownIcon} />
                                            </SelectTrigger>
                                            <SelectPortal>
                                                <SelectBackdrop />
                                                <SelectContent>
                                                    <SelectDragIndicatorWrapper>
                                                        <SelectDragIndicator />
                                                    </SelectDragIndicatorWrapper>
                                                    <SelectItem label="5" value="5" />
                                                    <SelectItem label="10" value="10" />
                                                    <SelectItem label="20" value="20" />
                                                    <SelectItem label="50" value="50" />
                                                </SelectContent>
                                            </SelectPortal>
                                        </Select>
                                    </FormControl>
                                </Box>

                                <Button onPress={clearFilters} variant="outline" size="sm">
                                    <ButtonText>Clear Filters</ButtonText>
                                </Button>

                                <Button
                                    onPress={async () => {
                                        try {
                                            const db = await getDB();
                                            const testMessage = `Test SMS message from SkyObs - ${Date.now()}`;
                                            await insertLSmsLog(db, {
                                                stnId: 1,
                                                status: "success",
                                                msg: testMessage,
                                                recip: "09123456789",
                                            });
                                            Alert.alert("Success", "Test SMS log added");
                                            fetchSmsLogs(); // Refresh the list
                                        } catch (error) {
                                            console.error("Error adding test SMS:", error);
                                            Alert.alert("Error", "Failed to add test SMS");
                                        }
                                    }}
                                    variant="solid"
                                    size="sm"
                                    className="bg-blue-500"
                                >
                                    <ButtonText>Add Test SMS</ButtonText>
                                </Button>
                            </>
                        )}
                    </VStack>

                    {/* SMS Logs Table */}
                    <Box className="border border-gray-200 rounded-lg overflow-hidden">
                        {isLoading ? (
                            <Box className="p-4 items-center">
                                <Text className="text-gray-500">Loading SMS history...</Text>
                            </Box>
                        ) : smsLogs.length === 0 ? (
                            <Box className="p-4 items-center">
                                <Text className="text-gray-500">No SMS records found</Text>
                            </Box>
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <Box className="min-w-[800px]">
                                    <TableHeader className="bg-gray-50">
                                        <TableRow>
                                            <TableHead className="p-3 font-medium w-[120px] text-xs">
                                                Date Sent
                                            </TableHead>
                                            <TableHead className="p-3 font-medium w-[100px] text-xs">
                                                Status
                                            </TableHead>
                                            <TableHead className="p-3 font-medium w-[120px] text-xs">
                                                Recipient
                                            </TableHead>
                                            <TableHead className="p-3 font-medium w-[120px] text-xs">
                                                Station
                                            </TableHead>
                                            <TableHead className="p-3 font-medium w-[200px] text-xs">
                                                Message
                                            </TableHead>
                                            <TableHead className="p-3 font-medium w-[80px] text-xs">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>

                                    <FlatList
                                        data={smsLogs}
                                        keyExtractor={(item) => (item.smsId || item.recip + item.dateSent).toString()}
                                        renderItem={({ item, index }) => (
                                            <TableRow className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                                <TableData className="p-3 text-xs">
                                                    {formatDateTime(item.dateSent || "")}
                                                </TableData>
                                                <TableData className="p-3">
                                                    <Badge className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status || "unknown")}`}>
                                                        <BadgeText size="sm">{item.status || "unknown"}</BadgeText>
                                                    </Badge>
                                                </TableData>
                                                <TableData className="p-3 text-xs">
                                                    {item.recip || ""}
                                                </TableData>
                                                <TableData className="p-3 text-xs">
                                                    {item.stnName || item.ICAO || `Station ${item.stnId || ""}`}
                                                </TableData>
                                                <TableData className="p-3 text-xs max-w-[200px]">
                                                    <Text numberOfLines={2} className="text-xs">
                                                        {item.msg || ""}
                                                    </Text>
                                                </TableData>
                                                <TableData className="p-3">
                                                    <Button
                                                        size="xs"
                                                        variant="outline"
                                                        onPress={() => handleViewDetails(item)}
                                                    >
                                                        <ButtonText>View</ButtonText>
                                                    </Button>
                                                </TableData>
                                            </TableRow>
                                        )}
                                    />
                                </Box>
                            </ScrollView>
                        )}
                    </Box>

                    {/* SMS Detail Modal */}
                    <SmsDetailModal
                        visible={showDetailModal}
                        sms={selectedSms}
                        onClose={() => {
                            setShowDetailModal(false);
                            setSelectedSms(null);
                        }}
                    />

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <Box className="flex-row items-center justify-between mt-4 p-4 bg-gray-50 rounded-lg">
                            <Text className="text-sm text-gray-600">
                                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
                            </Text>
                            <Box className="flex-row gap-2">
                                <Button
                                    onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    variant="outline"
                                    size="sm"
                                >
                                    <ButtonText>Previous</ButtonText>
                                </Button>
                                <Text className="text-sm self-center px-2">
                                    Page {currentPage} of {totalPages}
                                </Text>
                                <Button
                                    onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    variant="outline"
                                    size="sm"
                                >
                                    <ButtonText>Next</ButtonText>
                                </Button>
                            </Box>
                        </Box>
                    )}
                </Box>
            </ScrollView>
        </SafeAreaView>
    );
}