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
import React, { useCallback } from "react";

interface FormInputProps {
    label: string;
    value: string;
    setterFn: (value: string) => void;

    error: string;
    setErrFn: (message: string) => void;

    formatFn?: (value: string) => string;
    validateFn?: (value: string) => ValidationResult | Promise<ValidationResult>;
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

    onFocus?: () => void;
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
    onFocus,
}: FormInputProps) {

    const showClear = !disabled && !readonly && value.length > 0;

    const handleFocus = useCallback(() => {
        // Abort pending auto advance when user manually focuses
        setPendingAdvance(null);
        onFocus?.();
    }, [onFocus, setPendingAdvance]);

    const handleChangeText = useCallback(
        (text: string) => {
            // If maxTypableChars is set, prevent typing beyond it
            if (maxTypableChars && text.replace(".", "").length > maxTypableChars) return;

            setterFn(text);

            const limit = maxTypableChars ?? maxLength;

            // Only trigger auto-advance for raw numeric input (no decimal yet)
            const numericLength = text.replace(".", "").length;
            if (limit && numericLength >= limit) {
                setPendingAdvance(fieldKey ?? null);
            }
        },
        [setterFn, maxTypableChars, maxLength, fieldKey, setPendingAdvance]
    );

    const handleBlur = useCallback(async () => {
        let newValue = value;

        // Format
        if (formatFn) {
            newValue = formatFn(newValue);
            setterFn(newValue);
        }

        // Validate
        if (validateFn) {
            const { isValid, error: errMsg } = await validateFn(newValue);
            setErrFn(isValid ? "" : errMsg || "Invalid value");
            if (!isValid) return;
        }

        // Auto compute
        if (autoComputeFn) {
            try {
                await autoComputeFn(newValue);
                setPendingAdvance(fieldKey ?? null);
            } catch (err) {
                console.error("Auto-compute error:", err);
            }
        }
    }, [value, formatFn, validateFn, autoComputeFn, setterFn, setErrFn, fieldKey]);

    return (
        <FormControl className="mt-2 flex flex-row items-center gap-2" isInvalid={!!error}>
            <FormControlLabel className="w-40">
                <FormControlLabelText className="text-gray-700" size="sm">
                    {label}
                </FormControlLabelText>
            </FormControlLabel>

            <Box className="flex-1">
                <Box className="flex flex-row gap-2">
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
                                onFocus={handleFocus}
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

                    {showCheckbox && (
                        <Button
                            size="lg"
                            variant="solid"
                            action="secondary"
                            className={`px-4 border ${checked
                                ? "bg-blue-400 border-blue-400"
                                : "bg-white border-neutral-300"
                                }`}
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
                    <FormControlErrorText className="text-xs">
                        {error}
                    </FormControlErrorText>
                </FormControlError>
            </Box>
        </FormControl>
    );
}