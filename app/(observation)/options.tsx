import { Box } from "@/components/ui/box";
import { Grid, GridItem } from "@/components/ui/grid";
import { Heading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { getDB } from "@/src/utils/db";
import { useRouter } from "expo-router";
import { Airplay, AlertCircle, AlertTriangle, ChevronLeft, Cloud, Sun } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable } from "react-native";

type Category = {
    cID: number;
    cName: string;
};

// Icons
const categoryIcons: Record<string, any> = {
    SYNOP: Cloud,
    METAR: Airplay,
    SPECI: AlertTriangle,
    AGROMET: Sun,
};

// Background colors
const categoryColors: Record<string, string> = {
    SYNOP: "bg-blue-400",
    METAR: "bg-gray-300",
    SPECI: "bg-yellow-400",
    AGROMET: "bg-green-400",
};

// Text colors
const categoryTextColors: Record<string, string> = {
    SYNOP: "text-white",
    METAR: "text-black",
    SPECI: "text-black",
    AGROMET: "text-white",
};

// Column spans
const categoryColSpans: Record<string, number> = {
    SYNOP: 2,
    METAR: 1,
    SPECI: 1,
    AGROMET: 2,
};

const categoryRoutes: Record<
    string,
    { pathname: string; params?: Record<string, string> }
> = {
    SYNOP: { pathname: "/(observation)/(SYNOP)/datetime" },

    METAR: {
        pathname: "/(observation)/(MorS)/datetime",
        params: { MorS: "METAR" },
    },

    SPECI: {
        pathname: "/(observation)/(MorS)/datetime",
        params: { MorS: "SPECI" },
    },
};

export default function ObservationOptionsScreen() {
    const [categories, setCategories] = useState<Category[]>([]);
    const router = useRouter();

    useEffect(() => {
        const fetchCategories = async () => {
            const db = await getDB();
            const rows: { cID: number; cName: string }[] = await db.getAllAsync(
                "SELECT * FROM category;"
            );
            setCategories(rows);
        };
        fetchCategories();
    }, []);

    const handleNavigate = (categoryName: string) => {
        if (categoryName === "AGROMET") return;

        const route = categoryRoutes[categoryName];

        if (route) {
            router.push({
                pathname: route.pathname,
                params: route.params,
            });
        }
    };

    return (
        <Box className="flex-1 bg-white p-4">
            <Box className="flex-row gap-4 items-center">
                <Pressable className="items-center justify-center" onPress={() => router.back()}>
                    <Icon as={ChevronLeft} size="xl" />
                </Pressable>
                <Box className="flex-1">
                    <Heading size="xl" className="font-bold text-gray-900">
                        Observation Category
                    </Heading>
                    <Text className="text-gray-500 text-sm mb-4">
                        Select a category to add a report
                    </Text>
                </Box>
            </Box>

            <Grid _extra={{ className: "grid-cols-2" }} rowGap={8} columnGap={8}>
                {categories.map((item) => {
                    const CategoryIcon = categoryIcons[item.cName] ?? Cloud;
                    const bgClass = categoryColors[item.cName] ?? "bg-gray-300";
                    const textColor = categoryTextColors[item.cName] ?? "text-black";
                    const colSpan = categoryColSpans[item.cName] ?? 1;
                    const isDisabled = item.cName === "AGROMET";

                    return (
                        <GridItem
                            key={item.cID}
                            _extra={{
                                className: `col-span-${colSpan}`,
                            }}
                        >
                            <Pressable
                                onPress={() => handleNavigate(item.cName)}
                                disabled={isDisabled}
                            >
                                <Box
                                    className={`
                    relative rounded-lg
                    ${bgClass} shadow-lg
                    items-center justify-center p-6
                    ${isDisabled ? "opacity-50" : ""}
                  `}
                                >
                                    {/* Icon */}
                                    <Box className="mb-3">
                                        <Icon
                                            as={CategoryIcon}
                                            size="xl"
                                            color={textColor.replace("text-", "")}
                                        />
                                    </Box>

                                    {/* Category Name */}
                                    <Text className={`text-center font-semibold text-lg ${textColor}`}>
                                        {item.cName}
                                    </Text>

                                    {/* Description */}
                                    <Text className={`text-center mt-1 text-sm ${textColor}`}>
                                        {item.cName === "SYNOP" && "Surface Weather Report"}
                                        {item.cName === "METAR" && "Aerodrome Report"}
                                        {item.cName === "SPECI" && "Special Report"}
                                        {item.cName === "AGROMET" && "Agricultural Meteorology"}
                                    </Text>

                                    {/* Overlay for disabled option */}
                                    {isDisabled && (
                                        <Box className="absolute inset-0 bg-black/80 rounded-lg flex items-center justify-center overflow-hidden">
                                            <Box className="flex flex-row items-center gap-2">
                                                <Icon as={AlertCircle} className="text-white" />
                                                <Text className="text-white font-semibold">
                                                    Not Available Yet
                                                </Text>
                                            </Box>
                                        </Box>
                                    )}
                                </Box>
                            </Pressable>
                        </GridItem>
                    );
                })}
            </Grid>
        </Box>
    );
}