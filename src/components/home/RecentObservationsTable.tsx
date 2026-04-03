import { Badge, BadgeText } from "@/components/ui/badge";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";
import {
    Popover,
    PopoverArrow,
    PopoverBackdrop,
    PopoverBody,
    PopoverContent
} from "@/components/ui/popover";
import { TableData, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Text } from "@/components/ui/text";
import { useRouter } from "expo-router";
import { Check, Eye, MoreVertical, Pencil } from "lucide-react-native";
import { useState } from "react";
import { FlatList, Pressable, ScrollView } from "react-native";

interface SynopRow {
    sID: string | number;
    sHour: number | string;
    sDate?: string;
    stnID?: string | number;
    category?: string;
    SummTotal?: number | null; // Visibility
    wDir?: number | null;
    wSpd?: number | null;
    dBulb?: number | null;
    wBulb?: number | null;
    dPoiint?: number | null;
    RH?: number | null;
    vaporP?: number | null;
    mslP?: number | null;
    amtLC?: number | null; // Clouds low
    RR?: number | null; // Rainfall
    obsINT?: string | null;
    smsMetarSent?: boolean;
    smsSynopSent?: boolean;
    smsSpeciSent?: boolean;
    isValidated?: 0 | 1;
}

interface RecentObservationsTableProps {
    synopData: SynopRow[];
    isLoading?: boolean;
    onGenerateCode: (row: SynopRow) => void; // corrected typing
    onView: (row: SynopRow) => void; // corrected typing
    onEdit: (row: SynopRow) => void; // corrected typing
}

const formatValue = (val: number | null | undefined, unit?: string) =>
    val !== null && val !== undefined ? `${val}${unit || ""}` : "—";

export default function RecentObservationsTable({
    synopData,
    isLoading = false,
    onGenerateCode,
    onView,
    onEdit
}: RecentObservationsTableProps) {
    const router = useRouter();

    const navigateToViewScreen = (row: SynopRow) => {
        if (!row.stnID || !row.sDate || !row.sHour) return;
        router.push({
            pathname: "/view",
            params: {
                stationId: row.stnID,
                date: row.sDate,
                time: row.sHour,
            },
        });
    };

    const navigateToEditScreen = (row: SynopRow) => {
        if (!row.stnID || !row.sDate || !row.sHour) return;
        router.push({
            pathname: "/data-collection",
            params: {
                stationId: row.stnID,
                date: row.sDate,
                time: row.sHour,
                status: "draft",
            },
        });
    };

    // Track which popover is open by row ID
    const [openPopoverId, setOpenPopoverId] = useState<string | number | null>(null);
    const closePopover = () => setOpenPopoverId(null);

    return (
        <Box className="mt-4">
            <Heading size="sm" className="mb-2">
                Daily Observations
            </Heading>

            <Box>
                {isLoading ? (
                    <Box className="p-4 items-center w-full border border-outline-200 rounded-lg">
                        <Text className="text-xs text-gray-500">Loading data...</Text>
                    </Box>
                ) : synopData.length === 0 ? (
                    <Box className="p-4 items-center w-full border border-outline-200 rounded-lg">
                        <Text className="text-xs text-gray-500">
                            No observation record available
                        </Text>
                    </Box>
                ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="w-full border border-outline-200 rounded-lg">
                        <Box className="min-w-[160px]">

                            <TableHeader className="bg-background-50">
                                <TableRow>
                                    <TableHead className="p-2 w-[70px]" />
                                    <TableHead className="text-xs  p-2 font-medium w-[45px]">Hour</TableHead>
                                    <TableHead className="text-xs p-2 font-medium w-[90px]">Category</TableHead>
                                    <TableHead className="text-xs  p-2 font-medium w-[65px]">MSLP</TableHead>
                                    <TableHead className="text-xs  p-2 font-medium w-[75px]">Temperature</TableHead>
                                    <TableHead className="text-xs  p-2 font-medium w-[65px]">Rainfall</TableHead>
                                    <TableHead className="text-xs  p-2 font-medium w-[75px]">Dew Point</TableHead>
                                    <TableHead className="text-xs  p-2 font-medium w-[75px]">Relative Humidity</TableHead>
                                    <TableHead className="text-xs  p-2 font-medium w-[75px]">Vapor Pressure</TableHead>
                                    <TableHead className="p-1 w-[35px]" />
                                </TableRow>
                            </TableHeader>

                            <FlatList
                                data={synopData}
                                keyExtractor={(item) => item.sID.toString()}
                                renderItem={({ item, index }) => (
                                    <TableRow className={index % 2 === 0 ? "bg-white" : "bg-background-50"}>
                                        {/* Code button */}
                                        <TableData className=" py-1 pl-2 pr-3 w-[70px]">
                                            <Button size="xs" onPress={() => onGenerateCode(item)} action="secondary">
                                                <ButtonText>Send Code</ButtonText>
                                            </Button>
                                        </TableData>

                                        <TableData className="text-xs  p-2 w-[45px]">{item.sHour ?? "—"}</TableData>

                                        {/* Category badges */}
                                        <TableData className="text-xs p-2 w-[90px] flex flex-row flex-wrap gap-1">
                                            {item.category?.split(",").map((cat) => (
                                                <Box key={cat} className="flex-row items-center gap-1">
                                                    <Badge
                                                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${cat === "SYNOP" ? "bg-blue-100 text-blue-800" :
                                                            cat === "METAR" ? "bg-gray-100 text-gray-800" :
                                                                cat === "SPECI" ? "bg-yellow-100 text-yellow-800" :
                                                                    "bg-gray-100 text-gray-800"
                                                            }`}
                                                    >
                                                        <BadgeText>{cat}</BadgeText>
                                                    </Badge>
                                                    {(cat === 'METAR' && item.smsMetarSent) ||
                                                        (cat === 'SYNOP' && item.smsSynopSent) ||
                                                        (cat === 'SPECI' && item.smsSpeciSent) ? (
                                                        <Icon as={Check} size="xs" className="text-green-600" />
                                                    ) : null}
                                                </Box>
                                            ))}
                                        </TableData>

                                        <TableData className="text-xs  p-2 w-[65px]">{formatValue(item.mslP, " hPa")}</TableData>
                                        <TableData className="text-xs  p-2 w-[75px]">{formatValue(item.dBulb, "°C")}</TableData>
                                        <TableData className="text-xs  p-2 w-[65px]">{formatValue(item.RR, " mm")}</TableData>
                                        <TableData className="text-xs  p-2 w-[75px]">{formatValue(item.dPoiint, "°C")}</TableData>
                                        <TableData className="text-xs  p-2 w-[75px]">{formatValue(item.RH, "%")}</TableData>
                                        <TableData className="text-xs  p-2 w-[75px]">{formatValue(item.vaporP, "mmHg")}</TableData>

                                        {/* Popover menu */}
                                        <TableData className=" p-2 w-[35px]">
                                            <Popover
                                                placement="bottom right"
                                                isOpen={openPopoverId === item.sID}
                                                onClose={closePopover}
                                                trigger={(triggerProps) => (
                                                    <Pressable
                                                        {...triggerProps}
                                                        onPress={() =>
                                                            setOpenPopoverId(openPopoverId === item.sID ? null : item.sID)
                                                        }
                                                    >
                                                        <Icon as={MoreVertical} />
                                                    </Pressable>
                                                )}
                                                trapFocus={false}
                                                crossOffset={10}
                                                shouldFlip={true}
                                            >
                                                <PopoverBackdrop />
                                                <PopoverContent className="p-2">
                                                    <PopoverArrow />
                                                    <PopoverBody className="gap-2">
                                                        <Pressable
                                                            className="flex-row items-center gap-2 p-2"
                                                            onPress={() => { onView(item); closePopover(); }}
                                                        >
                                                            <Icon as={Eye} size="sm" />
                                                            <Text size="sm">View</Text>
                                                        </Pressable>
                                                        {item.isValidated === 0 && (
                                                            <Pressable
                                                                className="flex-row items-center gap-2 p-2"
                                                                onPress={() => { onEdit(item); closePopover(); }}
                                                            >
                                                                <Icon as={Pencil} size="sm" />
                                                                <Text size="sm">Edit</Text>
                                                            </Pressable>
                                                        )}
                                                    </PopoverBody>
                                                </PopoverContent>
                                            </Popover>
                                        </TableData>
                                    </TableRow>
                                )}
                            />
                        </Box>
                    </ScrollView>
                )}
            </Box>
        </Box>
    );
}