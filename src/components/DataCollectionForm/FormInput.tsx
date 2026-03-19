import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import {
    FormControl,
    FormControlError,
    FormControlErrorIcon,
    FormControlErrorText,
    FormControlLabel,
    FormControlLabelText,
} from "@/components/ui/form-control";
import { CloseIcon } from "@/components/ui/icon";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { ValidationResult } from "@/src/utils/validators";
import { AlertCircleIcon } from "lucide-react-native";
import React from "react";

interface FormInputProps {
    label: string;
    value: string;
    setterFn: (value: string) => void;

    error: string;
    setErrFn: (message: string) => void;

    formatFn?: (value: string) => string;
    validateFn?: (value: string) => ValidationResult | Promise<ValidationResult>
    autoComputeFn?: (value: string) => void;

    inputRef?: any;
    fieldKey?: string;
    setPendingAdvance: React.Dispatch<React.SetStateAction<string | null>>;

    showCheckbox?: boolean;
    checked?: boolean;
    onCheckChange?: (value: boolean) => void;
    checkboxVal?: string;

    isAlphanumeric?: boolean;
    disabled?: boolean;
    readonly?: boolean;

    maxLength?: number;
    maxTypableChars?: number;
}

export default function FormInput({
    label,
    value,
    setterFn,
    error,
    setErrFn,
    formatFn,
    validateFn,
    autoComputeFn,
    inputRef,
    fieldKey,
    setPendingAdvance,
    showCheckbox = false,
    checked = false,
    onCheckChange,
    checkboxVal,
    isAlphanumeric = false,
    disabled = false,
    readonly = false,
    maxLength = 100,
    maxTypableChars,
}: FormInputProps) {
    const showClear = !disabled && !readonly && value.length > 0;

    const handleChangeText = (text: string) => {
        // limit typing
        if (maxTypableChars && text.length > maxTypableChars) {
            return;
        }

        setterFn(text)

        const limit = maxTypableChars ?? maxLength;

        if (limit && text.length >= limit) {
            setPendingAdvance(fieldKey ?? null);
        }
    }

    const handleBlur = async () => {
        let newValue = value;

        // 1. format
        if (typeof formatFn === "function") {
            newValue = formatFn(newValue);
            setterFn(newValue);
        }

        // 2. validate (supports sync + async)
        if (typeof validateFn === "function") {
            const { isValid, error: errMsg } = await validateFn(newValue);

            setErrFn(isValid ? "" : errMsg || "Invalid value");

            // Optional: stop auto-compute if invalid
            if (!isValid) return;
        }

        // 3. auto-compute (supports both sync and async)
        if (typeof autoComputeFn === "function") {
            try {
                await autoComputeFn(newValue);

                // mark that we should advance AFTER state update
                setPendingAdvance(fieldKey ?? null);
            } catch (err) {
                console.error("Auto-compute error:", err);
            }
        }
    };

    return (
        <FormControl className="mt-2 flex flex-row items-center gap-2" isInvalid={!!error}>
            {/* Label */}
            <FormControlLabel className="w-40">
                <FormControlLabelText
                    className="text-gray-700"
                    size="sm"
                >
                    {label}
                </FormControlLabelText>
            </FormControlLabel>

            {/* Input Wrapper (for positioning X) */}
            <Box className="flex-1">
                <Box className="flex-1 flex flex-row gap-2">
                    <Box className="flex-1">
                        <Input size="lg" isDisabled={checked || disabled} isReadOnly={readonly}>
                            <InputField
                                ref={inputRef}
                                value={value}
                                onChangeText={handleChangeText}
                                onSubmitEditing={() => setPendingAdvance(fieldKey ?? null)}
                                returnKeyType="next"
                                submitBehavior="submit"
                                onBlur={handleBlur}
                                inputMode={isAlphanumeric ? "text" : "numeric"}
                                maxLength={maxLength}
                            />

                            {showClear && !checked && (
                                <InputSlot onPress={() => setterFn("")}>
                                    <InputIcon
                                        as={CloseIcon}
                                        size="sm"
                                        className="text-gray-400 mr-2"
                                    />
                                </InputSlot>
                            )}
                        </Input>
                    </Box>

                    {/* Optional Checkbox */}
                    {showCheckbox && (
                        <Button
                            size="lg"
                            variant="solid"
                            action="secondary"
                            className={`px-4 border ${checked ? "bg-blue-400 border-blue-400" : "bg-white border-neutral-300"}`}
                            isDisabled={disabled}
                            onPress={() => onCheckChange?.(!checked)}
                        >
                            <ButtonText className={checked ? "text-white" : "text-gray-700"}>
                                T
                            </ButtonText>
                        </Button>
                    )}
                </Box>

                <FormControlError>
                    <FormControlErrorIcon as={AlertCircleIcon} size="xs" />
                    <FormControlErrorText className="text-xs">{error}</FormControlErrorText>
                </FormControlError>
            </Box>
        </FormControl>
    );
}