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
import React from "react";

interface FormTextareaProps {
  label: string;
  value: string;
  setterFn: (value: string) => void;

  error: string;
  setErrFn: (message: string) => void;

  disabled?: boolean;
  maxLength?: number;
  rows?: number;
}

export default function FormTextarea({
  label,
  value,
  setterFn,
  error,
  setErrFn,
  disabled = false,
  maxLength,
  rows = 3,
}: FormTextareaProps) {
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
            value={value}
            onChangeText={setterFn}
            maxLength={maxLength}
            numberOfLines={rows}
            textAlignVertical="top"
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