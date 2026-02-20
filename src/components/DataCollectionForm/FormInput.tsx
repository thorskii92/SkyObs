import { Box } from "@/components/ui/box";
import { Checkbox, CheckboxIcon, CheckboxIndicator } from "@/components/ui/checkbox";
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
import { AlertCircleIcon, CheckIcon } from "lucide-react-native";
import React from "react";

interface FormInputProps {
    label: string;
    value: string;
    setterFn: (value: string) => void;

    error: string;
    setErrFn: (message: string) => void;

    formatFn?: (value: string) => string;
    validateFn?: (value: string) => ValidationResult;
    autoComputeFn?: (value: string) => void;

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
    const showClear = !disabled && value.length > 0;

    const handleChangeText = (text: string) => {
        if (maxTypableChars && text.length > maxTypableChars) {
            return;
        }

        setterFn(text)
    }

    const handleBlur = async () => {
        let newValue = value;

        // 1. format
        if (typeof formatFn === "function") {
            newValue = formatFn(newValue);
            setterFn(newValue);
        }

        // 2. validate
        if (typeof validateFn === "function") {
            const { isValid, error: errMsg } = validateFn(newValue);
            setErrFn(isValid ? "" : errMsg || "Invalid value");

            // Optional: stop auto-compute if invalid
            if (!isValid) return;
        }

        // 3. auto-compute (supports both sync and async)
        if (typeof autoComputeFn === "function") {
            try {
                await autoComputeFn(newValue);
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
                                value={value}
                                onChangeText={handleChangeText}
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
                        <Checkbox
                            isChecked={checked}
                            onChange={onCheckChange}
                            isDisabled={disabled}
                            // @ts-ignore
                            value={checkboxVal}
                        >
                            <CheckboxIndicator size="lg" >
                                <CheckboxIcon as={CheckIcon} />
                            </CheckboxIndicator>
                        </Checkbox>
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