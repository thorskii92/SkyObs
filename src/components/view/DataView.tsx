import { Box } from "@/components/ui/box";
import { Grid, GridItem } from "@/components/ui/grid";
import { Heading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { CircleGauge, CloudSunRain, Cloudy, RulerDimensionLine, Thermometer, UserCircle2, View, Wind } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import DataViewHeader from "./DataViewHeader";

export default function DataView({ observedData }) {
    const [loadingOverlay, setLoadingOverlay] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoadingOverlay(false);
        }, 2);

        return () => clearTimeout(timer);
    }, []);

    // Helper function
    function formatValue(value: number | null | undefined, unit?: string) {
        if (value === null || value === undefined) return "-";
        return unit ? `${value} ${unit}` : `${value}`;
    }

    const dStatus = observedData.isValidated === 0 ? "recorded" : "validated";

    return (
        <>

            {/* if loadingOverlay, display spinner here to hide UI rendering to the user */}
            {loadingOverlay && (
                <Box
                    className="absolute inset-0 bg-white justify-center items-center z-50"
                >
                    <Spinner size="large" className="text-blue-400" />
                </Box>
            )}

            {/* Heading */}
            <DataViewHeader observedData={observedData} status={dStatus} />
            <KeyboardAwareScrollView showsVerticalScrollIndicator={false} className="flex-1 bg-white">
                {/* Visibility */}
                <Box className="flex flex-row px-2 mb-2">
                    {/* Content */}
                    <Box className="flex-1 bg-white shadow-sm p-4">
                        {/* Header with icon */}
                        <Box className="flex flex-row items-center gap-2 mb-4">
                            <Box className="bg-neutral-100 p-1.5 rounded-xl">
                                <Icon as={View} size="lg" />
                            </Box>
                            <Heading size="sm">Visibility</Heading>
                        </Box>

                        {/* Grid */}
                        <Grid _extra={{ className: "grid-cols-3" }}>
                            <GridItem _extra={{ className: "col-span-1" }}>
                                <Text size="xs" bold className="text-gray-500 mb-1">Height LL</Text>
                                <Text>{formatValue(observedData.heightLL, "m")}</Text>
                            </GridItem>

                            <GridItem _extra={{ className: "col-span-1" }}>
                                <Text size="xs" bold className="text-gray-500 mb-1">Visibility</Text>
                                <Text>{formatValue(observedData.VV, "km")}</Text>
                            </GridItem>

                            <GridItem _extra={{ className: "col-span-1" }}>
                                <Text size="xs" bold className="text-gray-500 mb-1">Summation Total</Text>
                                <Text>{formatValue(observedData.SummTotal, "km")}</Text>
                            </GridItem>
                        </Grid>
                    </Box>
                </Box>

                {/* Wind */}
                <Box className="flex flex-row px-2 mb-2">
                    {/* Left accent bar */}
                    {/* Content */}
                    <Box className="flex-1 bg-white shadow-sm p-4">
                        {/* Header with icon */}
                        <Box className="flex flex-row items-center gap-2 mb-4">
                            <Box className="bg-neutral-100 p-1.5 rounded-xl">
                                <Icon as={Wind} size="lg" />
                            </Box>
                            <Heading size="sm">Wind</Heading>
                        </Box>

                        {/* Grid */}
                        <Grid _extra={{ className: "grid-cols-3" }}>
                            <GridItem _extra={{ className: "col-span-1" }}>
                                <Text size="xs" bold className="text-gray-500 mb-1">Direction</Text>
                                <Text>{formatValue(observedData.wDir, "°")}</Text>
                            </GridItem>

                            <GridItem _extra={{ className: "col-span-1" }}>
                                <Text size="xs" bold className="text-gray-500 mb-1">Speed</Text>
                                <Text>{formatValue(observedData.wSpd, "km/h")}</Text>
                            </GridItem>
                        </Grid>
                    </Box>
                </Box>

                {/* Temperature */}
                <Box className="flex flex-row px-2 mb-2">
                    {/* Left accent bar */}
                    {/* Content */}
                    <Box className="flex-1 bg-white shadow-sm p-4">
                        {/* Header with icon */}
                        <Box className="flex flex-row items-center gap-2 mb-4">
                            <Box className="bg-neutral-100 p-1.5 rounded-xl">
                                <Icon as={Thermometer} size="lg" />
                            </Box>
                            <Heading size="sm">Temperature</Heading>
                        </Box>

                        {/* Grid */}
                        <Grid columnGap={8} rowGap={8} _extra={{ className: "grid-cols-3" }}>
                            <GridItem _extra={{ className: "col-span-1" }}>
                                <Text size="xs" bold className="text-gray-500 mb-1">Dry Bulb</Text>
                                <Text>{formatValue(observedData.dBulb, "°C")}</Text>
                            </GridItem>

                            <GridItem _extra={{ className: "col-span-1" }}>
                                <Text size="xs" bold className="text-gray-500 mb-1">Wet Bulb</Text>
                                <Text>{formatValue(observedData.wBulb, "°C")}</Text>
                            </GridItem>

                            <GridItem _extra={{ className: "col-span-1" }}>
                                <Text size="xs" bold className="text-gray-500 mb-1">Dew Point</Text>
                                <Text>{formatValue(observedData.dPoiint, "°C")}</Text>
                            </GridItem>

                            <GridItem _extra={{ className: "col-span-1" }}>
                                <Text size="xs" bold className="text-gray-500 mb-1">Relative Humidity</Text>
                                <Text>{formatValue(observedData.RH, "%")}</Text>
                            </GridItem>

                            <GridItem _extra={{ className: "col-span-2" }}>
                                <Text size="xs" bold className="text-gray-500 mb-1">Vapor Pressure</Text>
                                <Text>{formatValue(observedData.vaporP, "hPa")}</Text>
                            </GridItem>

                            <GridItem _extra={{ className: "col-span-1" }}>
                                <Text size="xs" bold className="text-gray-500 mb-1">Min. Temperature</Text>
                                <Text>{formatValue(observedData.minTemp, "°C")}</Text>
                            </GridItem>

                            <GridItem _extra={{ className: "col-span-1" }}>
                                <Text size="xs" bold className="text-gray-500 mb-1">Max. Temperature</Text>
                                <Text>{formatValue(observedData.maxTemp, "°C")}</Text>
                            </GridItem>
                        </Grid>
                    </Box>
                </Box>

                {/* Atmospheric Pressure */}
                <Box className="flex flex-row px-2 mb-2">
                    {/* Left accent bar */}
                    {/* Content */}
                    <Box className="flex-1 bg-white shadow-sm p-4">
                        {/* Header with icon */}
                        <Box className="flex flex-row items-center gap-2 mb-4">
                            <Box className="bg-neutral-100 p-1.5 rounded-xl">
                                <Icon as={CircleGauge} size="lg" />
                            </Box>
                            <Heading size="sm">Atmospheric Pressure</Heading>
                        </Box>

                        {/* Grid */}
                        <Grid columnGap={8} rowGap={8} _extra={{ className: "grid-cols-3" }}>
                            <GridItem _extra={{ className: "col-span-1" }}>
                                <Text size="xs" bold className="text-gray-500 mb-1">Station Pressure</Text>
                                <Text>{formatValue(observedData.stnP, "hPa")}</Text>
                            </GridItem>

                            <GridItem _extra={{ className: "col-span-1" }}>
                                <Text size="xs" bold className="text-gray-500 mb-1">MSL Pressure</Text>
                                <Text>{formatValue(observedData.mslP, "hPa")}</Text>
                            </GridItem>

                            <GridItem _extra={{ className: "col-span-1" }}>
                                <Text size="xs" bold className="text-gray-500 mb-1">Altimeter Setting</Text>
                                <Text>{formatValue(observedData.altP, "hPa")}</Text>
                            </GridItem>

                            <GridItem _extra={{ className: "col-span-1" }}>
                                <Text size="xs" bold className="text-gray-500 mb-1">Tendency</Text>
                                <Text>{formatValue(observedData.tendency)}</Text>
                            </GridItem>

                            <GridItem _extra={{ className: "col-span-1" }}>
                                <Text size="xs" bold className="text-gray-500 mb-1">Net 3-hr Change</Text>
                                <Text>{formatValue(observedData.net3hr)}</Text>
                            </GridItem>

                            <GridItem _extra={{ className: "col-span-1" }}>
                                <Text size="xs" bold className="text-gray-500 mb-1">24-hr Pressure Change</Text>
                                <Text>{formatValue(observedData.pres24)}</Text>
                            </GridItem>
                        </Grid>
                    </Box>
                </Box>

                {/* Pressure Computation */}
                <Box className="flex flex-row px-2 mb-2">
                    {/* Left accent bar */}
                    {/* Content */}
                    <Box className="flex-1 bg-white shadow-sm p-4">
                        {/* Header with icon */}
                        <Box className="flex flex-row items-center gap-2 mb-4">
                            <Box className="bg-neutral-100 p-1.5 rounded-xl">
                                <Icon as={RulerDimensionLine} size="lg" />
                            </Box>
                            <Heading size="sm">Pressure Computation</Heading>
                        </Box>

                        {/* Grid */}
                        <Grid columnGap={8} rowGap={8} _extra={{ className: "grid-cols-3" }}>
                            <GridItem _extra={{ className: "col-span-1" }}>
                                <Text size="xs" bold className="text-gray-500 mb-1">Attached Thermometer</Text>
                                <Text>{formatValue(observedData.pAttachTherm, "°C")}</Text>
                            </GridItem>

                            <GridItem _extra={{ className: "col-span-1" }}>
                                <Text size="xs" bold className="text-gray-500 mb-1">Barometer</Text>
                                <Text>{formatValue(observedData.PObsBaro, "hPa")}</Text>
                            </GridItem>

                            <GridItem _extra={{ className: "col-span-1" }}>
                                <Text size="xs" bold className="text-gray-500 mb-1">Barometer Correction</Text>
                                <Text>{formatValue(observedData.pCorrection, "hPa")}</Text>
                            </GridItem>

                            <GridItem _extra={{ className: "col-span-1" }}>
                                <Text size="xs" bold className="text-gray-500 mb-1">Station Pressure</Text>
                                <Text>{formatValue(observedData.stnP, "hPa")}</Text>
                            </GridItem>

                            <GridItem _extra={{ className: "col-span-1" }}>
                                <Text size="xs" bold className="text-gray-500 mb-1">Barograph</Text>
                                <Text>{formatValue(observedData.pBarograph, "hPa")}</Text>
                            </GridItem>

                            <GridItem _extra={{ className: "col-span-1" }}>
                                <Text size="xs" bold className="text-gray-500 mb-1">Barograph Correction</Text>
                                <Text>{formatValue(observedData.pBaroCorrection)}</Text>
                            </GridItem>
                        </Grid>
                    </Box>
                </Box>

                {/* Atmospheric Phenomena */}
                <Box className="flex flex-row px-2 mb-2">
                    {/* Left accent bar */}
                    {/* Content */}
                    <Box className="flex-1 bg-white shadow-sm p-4">
                        {/* Header with icon */}
                        <Box className="flex flex-row items-center gap-2 mb-4">
                            <Box className="bg-neutral-100 p-1.5 rounded-xl">
                                <Icon as={CloudSunRain} size="lg" />
                            </Box>
                            <Heading size="sm">Atmospheric Phenomena</Heading>
                        </Box>

                        {/* Grid */}
                        <Grid columnGap={8} rowGap={8} _extra={{ className: "grid-cols-3" }}>
                            <GridItem _extra={{ className: "col-span-1" }}>
                                <Text size="xs" bold className="text-gray-500 mb-1">Rainfall Amount</Text>
                                <Text>{formatValue(observedData.RR, "mm")}</Text>
                            </GridItem>

                            <GridItem _extra={{ className: "col-span-2" }}>
                                <Text size="xs" bold className="text-gray-500 mb-1">Observed Period</Text>
                                <Text>{formatValue(observedData.tR)}</Text>
                            </GridItem>

                            <GridItem _extra={{ className: "col-span-1" }}>
                                <Text size="xs" bold className="text-gray-500 mb-1">Present Weather</Text>
                                <Text>{formatValue(observedData.presW)}</Text>
                            </GridItem>

                            <GridItem _extra={{ className: "col-span-2" }}>
                                <Text size="xs" bold className="text-gray-500 mb-1">Past Weather</Text>
                                <Text>{formatValue(Number(`${observedData.pastW1}${observedData.pastW2}`))}</Text>
                            </GridItem>
                        </Grid>
                    </Box>
                </Box>

                {/* Clouds */}
                <Box className="flex flex-row px-2 mb-2">
                    {/* Left accent bar */}
                    {/* Content */}
                    <Box className="flex-1 bg-white shadow-sm p-4">
                        {/* Header with icon */}
                        <Box className="flex flex-row items-center gap-2 mb-4">
                            <Box className="bg-neutral-100 p-1.5 rounded-xl">
                                <Icon as={Cloudy} size="lg" />
                            </Box>
                            <Heading size="sm">Cloud Group</Heading>
                        </Box>

                        {/* 1st Layer */}
                        <Box className="bg-gray-50 p-3 rounded mb-4">
                            <Heading size="xs" className="mb-1 text-gray-600">First Layer</Heading>
                            <Grid _extra={{ className: "grid-cols-3" }}>
                                <GridItem _extra={{ className: "col-span-1" }}>
                                    <Text size="xs" className="text-gray-500 mb-1">Amount</Text>
                                    <Text size="sm">{formatValue(observedData.amtFirstLayer)}</Text>
                                </GridItem>
                                <GridItem _extra={{ className: "col-span-1" }}>
                                    <Text size="xs" className="text-gray-500 mb-1">Type</Text>
                                    <Text size="sm">{formatValue(observedData.typeFirstLayer)}</Text>
                                </GridItem>
                                <GridItem _extra={{ className: "col-span-1" }}>
                                    <Text size="xs" className="text-gray-500 mb-1">Height</Text>
                                    <Text size="sm">{formatValue(observedData.heightFirstLayer, "m")}</Text>
                                </GridItem>
                            </Grid>
                        </Box>

                        {/* 2nd Layer */}
                        <Box className="bg-gray-50 p-3 rounded mb-4">
                            <Heading size="xs" className="mb-1 text-gray-600">Second Layer</Heading>
                            <Grid _extra={{ className: "grid-cols-3" }}>
                                <GridItem _extra={{ className: "col-span-1" }}>
                                    <Text size="xs" className="text-gray-500 mb-1">Amount</Text>
                                    <Text size="sm">{formatValue(observedData.amtSecondLayer)}</Text>
                                </GridItem>
                                <GridItem _extra={{ className: "col-span-1" }}>
                                    <Text size="xs" className="text-gray-500 mb-1">Type</Text>
                                    <Text size="sm">{formatValue(observedData.typeSecondLayer)}</Text>
                                </GridItem>
                                <GridItem _extra={{ className: "col-span-1" }}>
                                    <Text size="xs" className="text-gray-500 mb-1">Height</Text>
                                    <Text size="sm">{formatValue(observedData.heightSecondLayer, "m")}</Text>
                                </GridItem>
                            </Grid>
                        </Box>

                        {/* 3rd Layer */}
                        <Box className="bg-gray-50 p-3 rounded mb-4">
                            <Heading size="xs" className="mb-1 text-gray-600">Third Layer</Heading>
                            <Grid _extra={{ className: "grid-cols-3" }}>
                                <GridItem _extra={{ className: "col-span-1" }}>
                                    <Text size="xs" className="text-gray-500 mb-1">Amount</Text>
                                    <Text size="sm">{formatValue(observedData.amtThirdLayer)}</Text>
                                </GridItem>
                                <GridItem _extra={{ className: "col-span-1" }}>
                                    <Text size="xs" className="text-gray-500 mb-1">Type</Text>
                                    <Text size="sm">{formatValue(observedData.typeThirdLayer)}</Text>
                                </GridItem>
                                <GridItem _extra={{ className: "col-span-1" }}>
                                    <Text size="xs" className="text-gray-500 mb-1">Height</Text>
                                    <Text size="sm">{formatValue(observedData.heightThirdLayer, "m")}</Text>
                                </GridItem>
                            </Grid>
                        </Box>

                        {/* 4th Layer */}
                        <Box className="bg-gray-50 p-3 rounded mb-4">
                            <Heading size="xs" className="mb-1 text-gray-600">Fourth Layer</Heading>
                            <Grid _extra={{ className: "grid-cols-3" }}>
                                <GridItem _extra={{ className: "col-span-1" }}>
                                    <Text size="xs" className="text-gray-500 mb-1">Amount</Text>
                                    <Text size="sm">{formatValue(observedData.amtFourthLayer)}</Text>
                                </GridItem>
                                <GridItem _extra={{ className: "col-span-1" }}>
                                    <Text size="xs" className="text-gray-500 mb-1">Type</Text>
                                    <Text size="sm">{formatValue(observedData.typeFourthLayer)}</Text>
                                </GridItem>
                                <GridItem _extra={{ className: "col-span-1" }}>
                                    <Text size="xs" className="text-gray-500 mb-1">Height</Text>
                                    <Text size="sm">{formatValue(observedData.heightFourthLayer, "m")}</Text>
                                </GridItem>
                            </Grid>
                        </Box>

                        <Grid columnGap={8} rowGap={8} _extra={{ className: "grid-cols-3" }}>
                            <GridItem _extra={{ className: "col-span-1" }}>
                                <Text size="xs" bold className="text-gray-500 mb-1">Amount of Low Clouds</Text>
                                <Text>{formatValue(observedData.amtLC)}</Text>
                            </GridItem>
                            <GridItem _extra={{ className: "col-span-2" }}>
                                <Text size="xs" bold className="text-gray-500 mb-1">Ceiling</Text>
                                <Text>{formatValue(observedData.ceiling)}</Text>
                            </GridItem>

                            <GridItem _extra={{ className: "col-span-1" }}>
                                <Text size="xs" bold className="text-gray-500 mb-1">Direction of Low Clouds</Text>
                                <Text>{formatValue(observedData.dirLow)}</Text>
                            </GridItem>

                            <GridItem _extra={{ className: "col-span-1" }}>
                                <Text size="xs" bold className="text-gray-500 mb-1">Direction of Mid Clouds</Text>
                                <Text>{formatValue(observedData.dirMid)}</Text>
                            </GridItem>

                            <GridItem _extra={{ className: "col-span-1" }}>
                                <Text size="xs" bold className="text-gray-500 mb-1">Direction of High Clouds</Text>
                                <Text>{formatValue(observedData.dirHigh)}</Text>
                            </GridItem>
                        </Grid>
                    </Box>
                </Box>

                {/* Remarks */}
                <Box className="flex flex-row px-2 mb-2">
                    {/* Left accent bar */}
                    {/* Content */}
                    <Box className="flex-1 bg-white shadow-sm p-4">
                        {/* Header with icon */}
                        <Box className="flex flex-row items-center gap-2 mb-2">
                            <Box className="bg-neutral-100 p-1.5 rounded-xl">
                                <Icon as={UserCircle2} size="lg" />
                            </Box>
                            <Heading size="sm">Observer's Remark</Heading>
                        </Box>

                        {/* Remark content */}
                        <Box className="bg-gray-50 p-2 rounded min-h-4">
                            <Text>{observedData.remark ?? "No remarks"}</Text>
                        </Box>
                    </Box>
                </Box>

                <Box className="flex items-center m-4">
                    <Box className="border-t border-gray-300 w-full mb-1 border-dashed" />
                </Box>
            </KeyboardAwareScrollView>
        </>
    );
}