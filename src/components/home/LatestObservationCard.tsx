import { Badge, BadgeText } from "@/components/ui/badge";
import { Box } from "@/components/ui/box";
import { Button, ButtonGroup, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Grid, GridItem } from "@/components/ui/grid";
import { Heading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { Check, Eye, MessageSquareCode, SquarePen } from "lucide-react-native";
import React from "react";

interface SynopRow {
    vaporP: any;
    RH: any;
    dPoiint: any;
    sHour?: string;
    obsINT?: string;
    remark?: string;
    SummTotal?: number;
    wDir?: number;
    wSpd?: number;
    dBulb?: number;
    wBulb?: number;
    mslP?: number;
    amtLC?: number;
    RR?: number;
    metarSent?: boolean;
    synopSent?: boolean;
    smsMetarSent?: boolean;
    smsSynopSent?: boolean;
    smsSpeciSent?: boolean;
}

interface LatestObservationCardProps {
    observation: SynopRow;
    onGenerateCode: () => void;
    onNavigateViewScreen?: () => void;
    onNavigateEditScreen?: () => void;
}

export default function LatestObservationCard({
    observation,
    onGenerateCode,
    onNavigateViewScreen,
    onNavigateEditScreen
}: LatestObservationCardProps) {
    const formatValue = (val: any, unit?: string) =>
        val !== undefined && val !== null ? `${val}${unit || ""}` : "-";

    return (
        <Box className="p-4 bg-white border border-gray-300 rounded-xl shadow-md w-full">
            {/* Header */}
            <Box className="flex flex-row mb-2 justify-between">
                <Box className="flex flex-row gap-2">
                    <Heading className="text-base justify-center items-center">
                        {observation.sHour || "-"} | {observation.obsINT || "-"}
                    </Heading>
                    <Badge><BadgeText>Recorded</BadgeText></Badge>
                </Box>
                <Pressable onPress={onNavigateEditScreen}>
                    <Icon as={SquarePen} className="text-gray-500" />
                </Pressable>
            </Box>

            {/* Remark */}
            {observation.remark && (
                <Text className="text-xs text-gray-500 italic mb-2">
                    "{observation.remark}"
                </Text>
            )}

            {/* Grid of essential data using Gluestack */}
            <Grid className="gap-2 mb-4" _extra={{ className: "grid-cols-3" }}>
                {/* Labels */}
                <GridItem _extra={{ className: "col-span-1" }}>
                    <Text className="text-[10px] font-semibold text-gray-500 text-center">
                        MSL Pressure
                    </Text>
                </GridItem>
                <GridItem _extra={{ className: "col-span-1" }}>
                    <Text className="text-[10px] font-semibold text-gray-500 text-center">
                        Temperature
                    </Text>
                </GridItem>
                <GridItem _extra={{ className: "col-span-1" }}>
                    <Text className="text-[10px] font-semibold text-gray-500 text-center">
                        Rainfall
                    </Text>
                </GridItem>

                {/* Values */}
                <GridItem _extra={{ className: "col-span-1" }}>
                    <Text className="text-sm font-medium text-center">
                        {formatValue(observation.mslP, " hPa")}
                    </Text>
                </GridItem>
                <GridItem _extra={{ className: "col-span-1" }}>
                    <Text className="text-sm font-medium text-center">
                        {formatValue(observation.dBulb, "°C")}
                    </Text>
                </GridItem>
                <GridItem _extra={{ className: "col-span-1" }}>
                    <Text className="text-sm font-medium text-center">
                        {formatValue(observation.RR, " mm")}
                    </Text>
                </GridItem>

                {/* Row 2 Labels */}
                <GridItem _extra={{ className: "col-span-1" }}>
                    <Text className="text-[10px] font-semibold text-gray-500 text-center">
                        Dew Point (°C)
                    </Text>
                </GridItem>
                <GridItem _extra={{ className: "col-span-1" }}>
                    <Text className="text-[10px] font-semibold text-gray-500 text-center">
                        Relative Humidity (%)
                    </Text>
                </GridItem>
                <GridItem _extra={{ className: "col-span-1" }}>
                    <Text className="text-[10px] font-semibold text-gray-500 text-center">
                        Vapor Pressure (mmHg)
                    </Text>
                </GridItem>

                {/* Row 2 Values */}
                <GridItem _extra={{ className: "col-span-1" }}>
                    <Text className="text-sm font-medium text-center">
                        {formatValue(observation.dPoiint, "°C")}
                    </Text>
                </GridItem>
                <GridItem _extra={{ className: "col-span-1" }}>
                    <Text className="text-sm font-medium text-center">
                        {formatValue(observation.RH, "%")}
                    </Text>
                </GridItem>
                <GridItem _extra={{ className: "col-span-1" }}>
                    <Text className="text-sm font-medium text-center">
                        {formatValue(observation.vaporP)}
                    </Text>
                </GridItem>
            </Grid>

            {/* Codes + Send */}
            <Box className="flex-row justify-between items-center">
                {/* Left: Category indicators */}
                <Box className="flex gap-1">
                    {observation.category?.split(",").map((cat) => (
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
                            {(cat === 'METAR' && observation.smsMetarSent) ||
                             (cat === 'SYNOP' && observation.smsSynopSent) ||
                             (cat === 'SPECI' && observation.smsSpeciSent) ? (
                                <Icon as={Check} size="xs" className="text-green-600" />
                            ) : null}
                        </Box>
                    ))}
                </Box>

                {/* Right: Generate Code */}
                <ButtonGroup className="flex flex-row">
                    <Button
                        size="sm"
                        action="primary"
                        variant="solid"
                        isDisabled={observation.metarSent && observation.synopSent}
                        onPress={onGenerateCode}
                        className="min-w-24 text-center"
                    >
                        <ButtonIcon as={MessageSquareCode} />
                        <ButtonText className="text-sm font-medium">Send Code</ButtonText>
                    </Button>
                    <Button
                        size="sm"
                        action="positive"
                        variant="solid"
                        onPress={onNavigateViewScreen}
                        className="min-w-24 bg-blue-400"
                    >
                        <ButtonText>View Data</ButtonText>
                        <ButtonIcon as={Eye} />
                    </Button>
                </ButtonGroup>
            </Box>
        </Box>
    );
}