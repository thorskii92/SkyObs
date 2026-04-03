import { Box } from "@/components/ui/box";
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { MessageCircleWarningIcon } from "lucide-react-native";
import React, { useCallback } from "react";

interface FormTextareaProps {
  label: string;
  value: string;
  setterFn: (value: string) => void;

  error: string;
  setErrFn: (message: string) => void;

  disabled?: boolean;
  readonly?: boolean;
  maxLength?: number;
  rows?: number;

  inputRef?: any;
  fieldKey?: string;
  setPendingAdvance: React.Dispatch<React.SetStateAction<string | null>>;
  onFocus?: () => void;
}

export default function FormTextarea({
  label,
  value,
  setterFn,
  error,
  setErrFn,
  disabled = false,
  readonly = false,
  maxLength,
  rows = 3,
  inputRef,
  fieldKey,
  setPendingAdvance,
  onFocus,
}: FormTextareaProps) {

  const handleFocus = useCallback(() => {
    // Cancel auto focus advance if user manually focuses
    setPendingAdvance(null);
    onFocus?.();
  }, [onFocus, setPendingAdvance]);

  const handleChangeText = useCallback((text: string) => {
    setterFn(text);

    // Auto advance when max length reached
    if (maxLength && text.length >= maxLength) {
      setPendingAdvance(fieldKey ?? null);
    }
  }, [setterFn, maxLength, fieldKey]);

  return (
    <FormControl className="mt-2 flex items-start gap-2">
      {/* Label */}
      <FormControlLabel className="w-40">
        <FormControlLabelText className="text-gray-700" size="sm">
          {label}
        </FormControlLabelText>
      </FormControlLabel>

      {/* Textarea Wrapper */}
      <Box className="flex-1 w-full">
        <Textarea className="flex-1 rounded" isDisabled={disabled} size="md">
          <TextareaInput
            ref={inputRef}
            value={value}
            onChangeText={handleChangeText}
            onFocus={handleFocus}
            maxLength={maxLength}
            numberOfLines={rows}
            textAlignVertical="top"
            editable={!readonly}
          />
        </Textarea>

        {/* Error Message */}
        {error && (
          <FormControlError>
            <FormControlErrorIcon as={MessageCircleWarningIcon} />
            <FormControlErrorText>{error}</FormControlErrorText>
          </FormControlError>
        )}
      </Box>
    </FormControl>
  );
}