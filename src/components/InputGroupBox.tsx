import { Box } from "@/components/ui/box";
import { FormControl, FormControlError, FormControlErrorIcon, FormControlErrorText, FormControlLabel } from "@/components/ui/form-control";
import { AlertCircleIcon, Icon } from "@/components/ui/icon";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useRef } from "react";
import { TextInput } from "react-native";
import { InputGroupType } from "../models/components";
import { isNumeric } from "../utils/validators";
import Separator from "./Separator";

export default function InputGroupBox({ groupName, bgColor, inputFields, errorHandler }: InputGroupType) {
    const inputRefs = useRef<TextInput[]>([]);

    // Helper to focus next empty + enabled field
    const focusNextEmptyField = (currentIndex: number) => {
        for (let i = currentIndex + 1; i < inputFields.length; i++) {
            const field = inputFields[i];
            const isEmpty = !field.value?.trim();
            const isEnabled = !field.isDisabled && !field.isReadOnly;
            if (isEmpty && isEnabled) {
                inputRefs.current[i]?.focus();
                break;
            }
        }
    };

    return (
        <FormControl className={`bg-white shadow`}>
            <Box className="flex pt-4 px-4">
                <Text className="text-lg font-bold">{groupName}</Text>
            </Box>
            <Separator />
            <VStack className="flex-1 items-center py-4 px-4" space="sm">
                {inputFields.map((field, index) => {
                    const { label, setterFn, blurFn, value, valueName, validFn, defaultValue, isDisabled, maxLength, maxCharType, error, isReadOnly } = field;

                    return (
                        <Box className="flex flex-row items-start" key={label}>
                            <FormControlLabel>
                                <Text className="w-40 pr-2">{label}</Text>
                            </FormControlLabel>

                            <VStack className="flex-1" space="sm">
                                <Input
                                    variant="outline"
                                    isDisabled={isDisabled}
                                    isInvalid={false}
                                    isReadOnly={isReadOnly}
                                    className="flex-1 rounded"
                                >
                                    <InputField
                                        ref={(el) => {
                                            if (el) inputRefs.current[index] = el;
                                        }}
                                        className="disabled:bg-gray-300 rounded"
                                        onChangeText={(text) => {
                                            setterFn(text);

                                            if (
                                                (
                                                    (maxCharType != null && text.length === maxCharType) ||
                                                    (maxLength != null && text.length === maxLength)
                                                ) &&
                                                (
                                                    !isNumeric || text[text.length - 1] !== "."
                                                )
                                            ) {
                                                focusNextEmptyField(index);
                                            }

                                        }}
                                        onBlur={async () => {
                                            let v = value;

                                            // Blur computation
                                            if (typeof blurFn === "function" && v != null) {
                                                const result = blurFn(String(v));

                                                if (result instanceof Promise) {
                                                    const resolved = await result;
                                                    setterFn(resolved);
                                                    v = resolved;
                                                } else {
                                                    setterFn(result);
                                                    v = result;
                                                }
                                            }

                                            // Validation
                                            if (validFn) {
                                                const { isValid, error } = validFn(v);

                                                console.log(`isValid:`, isValid)
                                                console.log(`error:`, error)

                                                if (!isValid) {
                                                    errorHandler((prev: any) => ({
                                                        ...prev,
                                                        [valueName]: error
                                                    }));
                                                } else {
                                                    errorHandler((prev: any) => {
                                                        const { [valueName]: _, ...rest } = prev;
                                                        return rest;
                                                    });
                                                }
                                            }
                                        }}
                                        maxLength={maxLength}
                                        keyboardType="numeric"
                                        inputMode="numeric"
                                        value={value ?? defaultValue ?? ""}
                                    />
                                </Input>

                                {error && (
                                    <Box className="flex flex-row items-start gap-2">
                                        <Icon as={AlertCircleIcon} size="sm" className="text-red-500" />
                                        <Text className="text-sm text-red-500">{error}</Text>
                                    </Box>
                                )}
                            </VStack>

                            <FormControlError>
                                <FormControlErrorIcon as={AlertCircleIcon} />
                                <FormControlErrorText>{"uwu"}</FormControlErrorText>
                            </FormControlError>
                        </Box>
                    );
                })}
            </VStack>
        </FormControl>
    );
}
