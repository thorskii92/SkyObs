import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Calendar, ClipboardCheck, Clock, Save } from "lucide-react-native";
import React, { memo } from "react";

interface ObservationHeaderProps {
    stationName: string;
    date: string;
    time: string;

    status: "new" | "recorded" | "validated";

    onAction: (mode: "save" | "update" | "qc") => Promise<boolean>;

    isSaving: boolean;
}

const ObservationHeader = ({
    stationName,
    date,
    time,
    status,
    onAction,
    isSaving,
}: ObservationHeaderProps) => {

    const formattedDate = new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const saveButtonLabel = () => {
        if (status === "new") return "Save";
        if (status === "recorded") return "Update";
        return "Saved";
    };

    const handleSavePress = () => {
        if (status === "new") return onAction("save");
        if (status === "recorded") return onAction("update");
    };

    return (
        <Box className="flex gap-4 bg-blue-400 px-4 py-6 shadow-lg w-full rounded-xl">

            {/* Header */}
            <Box className="flex flex-col gap-2">
                <Heading className="text-2xl text-center font-bold text-white">
                    {stationName}
                </Heading>

                <Box className="flex-row gap-2 items-center justify-center">

                    {/* Date */}
                    <Badge className="rounded-lg gap-2 bg-blue-50 px-3 py-1 border border-blue-100">
                        <BadgeIcon as={Calendar} className="text-blue-500" />
                        <BadgeText className="text-blue-600 font-medium">
                            {formattedDate}
                        </BadgeText>
                    </Badge>

                    {/* Time */}
                    <Badge className="rounded-lg gap-2 bg-blue-50 px-3 py-1 border border-blue-100">
                        <BadgeIcon as={Clock} className="text-blue-500" />
                        <BadgeText className="text-blue-600 font-medium">
                            {time}
                        </BadgeText>
                    </Badge>

                </Box>
            </Box>

            {/* Action Buttons */}
            <Box className="flex flex-row items-center justify-center gap-2">

                {/* Save / Update */}
                {status !== "validated" && (
                    <Button
                        className={`
                            flex-1 rounded-xl bg-white
                            active:bg-blue-50
                            disabled:opacity-50 disabled:bg-gray-100
                            ${isSaving ? "opacity-80" : ""}
                        `}
                        size="md"
                        disabled={isSaving}
                        onPress={handleSavePress}
                    >
                        <ButtonIcon
                            as={Save}
                            size="sm"
                            className="text-blue-500"
                        />
                        <ButtonText className="font-semibold text-blue-600 text-md">
                            {isSaving ? "Saving..." : saveButtonLabel()}
                        </ButtonText>
                    </Button>
                )}

                {/* Mark QC */}
                {status === "recorded" && (
                    <Button
                        className={`
                            flex-1 rounded-xl bg-green-700
                            active:bg-green-800
                            disabled:opacity-50 disabled:bg-green-300
                            ${isSaving ? "opacity-80" : ""}
                        `}
                        size="md"
                        disabled={isSaving}
                        onPress={() => onAction("qc")}
                    >
                        <ButtonIcon
                            as={ClipboardCheck}
                            className="text-white"
                            size="sm"
                        />
                        <ButtonText className="text-white font-semibold text-md">
                            {isSaving ? "Processing..." : "Mark QC"}
                        </ButtonText>
                    </Button>
                )}

            </Box>
        </Box>
    );
};

export default memo(ObservationHeader);