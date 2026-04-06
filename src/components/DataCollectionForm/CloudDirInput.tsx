import {
    AlertDialog,
    AlertDialogBackdrop,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import { Box } from "@/components/ui/box";
import {
    FormControl,
    FormControlLabel,
    FormControlLabelText,
} from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";
import { Input, InputField } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import {
    ArrowDown,
    ArrowDownLeft,
    ArrowDownRight,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    ArrowUpLeft,
    ArrowUpRight,
    BanIcon,
    Circle,
    XIcon
} from "lucide-react-native";
import React, { useState } from "react";

interface CompassDialInputProps {
    label: string;
    value: string;
    onChange: (val: string) => void;
    disabled?: boolean;

    fieldKey?: string;
    setPendingAdvance: React.Dispatch<React.SetStateAction<string | null>>;
}

const compassSize = 150;
const buttonSize = 36;

const DIRECTION_POSITIONS: Record<string, { x: number; y: number }> = {
    N: { x: 0.5, y: 0.05 },
    NE: { x: 0.85, y: 0.15 },
    E: { x: 0.95, y: 0.5 },
    SE: { x: 0.85, y: 0.8 },
    S: { x: 0.5, y: 0.95 },
    SW: { x: 0.15, y: 0.8 },
    W: { x: 0.05, y: 0.5 },
    NW: { x: 0.15, y: 0.15 },
    ND: { x: 0.5, y: 0.5 },
};

const DIRECTION_ICONS: Record<string, any> = {
    N: ArrowDown,
    NE: ArrowDownLeft,
    E: ArrowLeft,
    SE: ArrowUpLeft,
    S: ArrowUp,
    SW: ArrowUpRight,
    W: ArrowRight,
    NW: ArrowDownRight,
    ND: Circle,
};

export default function CloudDirInput({
    label,
    value = "",
    onChange,
    disabled = false,
    fieldKey,
    setPendingAdvance,
}: CompassDialInputProps) {
    const [isOpen, setIsOpen] = useState(false);

    const openDialog = () => {
        // Cancel any pending auto focus when user manually interacts
        setPendingAdvance(null);
        setIsOpen(true);
    };

    const selectDirection = (dir: string) => {
        onChange(dir);
        setIsOpen(false);

        // Move to next field after selection
        setTimeout(() => {
            setPendingAdvance(fieldKey ?? null);
        }, 100);
    };

    const clearDirection = () => {
        onChange("");
        setIsOpen(false);

        setTimeout(() => {
            setPendingAdvance(fieldKey ?? null);
        }, 100);
    };

    return (
        <>
            {/* Form Field */}
            <FormControl className="mt-2 flex flex-row items-center gap-2">
                <FormControlLabel className="w-40">
                    <FormControlLabelText
                        className="text-gray-700"
                        size="sm"
                    >
                        {label}
                    </FormControlLabelText>
                </FormControlLabel>

                <Pressable
                    disabled={disabled}
                    className="flex-1"
                    onPress={openDialog}
                >
                    <Box pointerEvents="none">
                        <Input isReadOnly isDisabled={disabled}>
                            <InputField value={String(value ?? "")} />
                        </Input>
                    </Box>
                </Pressable>
            </FormControl>

            {/* Dialog */}
            <AlertDialog isOpen={isOpen}>
                <AlertDialogBackdrop />
                <AlertDialogContent className="w-80">
                    <AlertDialogHeader className="flex-row items-center justify-between">
                        <Heading size="sm">
                            Select {label}
                        </Heading>

                        <Pressable
                            onPress={() => setIsOpen(false)}
                            className="p-1 rounded-full bg-gray-100"
                        >
                            <Icon as={XIcon} />
                        </Pressable>
                    </AlertDialogHeader>

                    <AlertDialogBody>
                        <Box className="items-center justify-center p-4">
                            <Box
                                className="bg-gray-100 rounded-full relative items-center justify-center mt-4"
                                style={{
                                    width: compassSize,
                                    height: compassSize,
                                }}
                            >
                                {/* Crosshair */}
                                <Box
                                    className="absolute bg-gray-200"
                                    style={{
                                        width: 2,
                                        height: compassSize,
                                        left: compassSize / 2 - 1,
                                    }}
                                />
                                <Box
                                    className="absolute bg-gray-200"
                                    style={{
                                        height: 2,
                                        width: compassSize,
                                        top: compassSize / 2 - 1,
                                    }}
                                />

                                {/* Direction Buttons */}
                                {Object.entries(DIRECTION_POSITIONS).map(
                                    ([dir, pos]) => {
                                        const dirIcon = DIRECTION_ICONS[dir];
                                        const isActive = value === dir;

                                        return (
                                            <Pressable
                                                key={dir}
                                                className={`absolute -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full ${
                                                    isActive
                                                        ? "bg-blue-400 scale-110"
                                                        : "bg-gray-200"
                                                }`}
                                                style={{
                                                    left: pos.x * compassSize,
                                                    top: pos.y * compassSize,
                                                    width: buttonSize,
                                                    height: buttonSize,
                                                }}
                                                onPress={() =>
                                                    selectDirection(dir)
                                                }
                                            >
                                                <Icon
                                                    as={dirIcon}
                                                    color={
                                                        isActive
                                                            ? "white"
                                                            : "#374151"
                                                    }
                                                />
                                            </Pressable>
                                        );
                                    }
                                )}
                            </Box>
                        </Box>
                    </AlertDialogBody>

                    <AlertDialogFooter className="flex-row justify-between">
                        <Pressable
                            onPress={clearDirection}
                            className="items-center justify-center rounded-full bg-gray-200 p-3"
                        >
                            <Icon as={BanIcon} />
                        </Pressable>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}