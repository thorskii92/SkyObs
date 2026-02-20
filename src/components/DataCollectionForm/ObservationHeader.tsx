import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { ClipboardCheck, Save } from "lucide-react-native";
import React, { memo } from "react";

interface ObservationHeaderProps {
    stationName: string;
    date: string; // ISO string or Date
    time: string;
    status: "new" | "draft" | "view";
    onSave: () => void;
    onMarkQC: () => void;
}

const ObservationHeader = ({
    stationName,
    date,
    time,
    status,
    onSave,
    onMarkQC,
}: ObservationHeaderProps) => {
    const formattedDate = new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const isReadOnly = status === "view";

    return (
        <Box className="flex gap-4 bg-white px-8 pt-12 pb-4 shadow-lg w-full mb-2">
            {/* Header */}
            <Box className="flex flex-col space-y-1">
                <Heading className="text-2xl text-center font-bold">{stationName}</Heading>
                <Text className="text-lg text-center">
                    {formattedDate} • {time}
                </Text>
            </Box>

            {/* Action Buttons: hidden in read-only view */}
            {status !== "view" && (
                <Box className="flex flex-row items-center justify-center gap-2">

                    {/* Save Button */}
                    <Button
                        className="flex-1 rounded-xl"
                        action="primary"
                        size="xl"
                        disabled={status === "draft"}
                        onPress={onSave}
                    >
                        <ButtonIcon as={Save} className="text-white" size="sm" />
                        <ButtonText className="text-white font-semibold text-md">
                            {status === "new" ? "Save" : "Update Draft"}
                        </ButtonText>
                    </Button>

                    {/* Mark QC Button - only for draft */}
                    {status === "draft" && (
                        <Button
                            className="flex-1 rounded-xl"
                            action="positive"
                            size="xl"
                            onPress={onMarkQC}
                        >
                            <ButtonIcon as={ClipboardCheck} className="text-white" size="sm" />
                            <ButtonText className="text-white font-semibold text-md">
                                Mark QC
                            </ButtonText>
                        </Button>
                    )}

                </Box>
            )}
        </Box>
    );
};

export default memo(ObservationHeader);