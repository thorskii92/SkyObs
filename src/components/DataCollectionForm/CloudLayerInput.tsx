import { Box } from "@/components/ui/box";
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
import { Text } from "@/components/ui/text";
import { MessageCircleWarningIcon } from "lucide-react-native";
import React from "react";

interface CloudLayerInputProps {
  label: string;
  amount: string;
  type: string;
  height: string;
  setAmount: (value: string) => void;
  setType: (value: string) => void;
  setHeight: (value: string) => void;

  errorAmount?: string;
  errorType?: string;
  errorHeight?: string;
  setErrorAmount?: (msg: string) => void;
  setErrorType?: (msg: string) => void;
  setErrorHeight?: (msg: string) => void;

  maxLAmount?: number;
  maxLType?: number;
  maxLHeight?: number;

  disabled?: boolean;

  // navigation
  amountKey?: string;
  typeKey?: string;
  heightKey?: string;

  amountRef?: any;
  typeRef?: any;
  heightRef?: any;

  setPendingAdvance: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function CloudLayerInput({
  label,
  amount,
  type,
  height,
  setAmount,
  setType,
  setHeight,
  errorAmount,
  errorType,
  errorHeight,
  setErrorAmount,
  setErrorType,
  setErrorHeight,
  maxLAmount = 1,
  maxLType = 2,
  maxLHeight = 3,
  disabled = false,
  amountKey,
  typeKey,
  heightKey,
  amountRef,
  typeRef,
  heightRef,
  setPendingAdvance
}: CloudLayerInputProps) {
  const showClearAmount = !disabled && amount.length > 0;
  const showClearType = !disabled && type.length > 0;
  const showClearHeight = !disabled && height.length > 0;

  const handleAmountChange = (v: string) => {
    if (v.length > maxLAmount) return;

    setAmount(v);
    setErrorAmount?.("");

    if (v.length >= maxLAmount) {
      setPendingAdvance(amountKey ?? null);
    }
  };

  const handleTypeChange = (v: string) => {
    if (v.length > maxLType) return;

    setType(v);
    setErrorType?.("");

    if (v.length >= maxLType) {
      setPendingAdvance(typeKey ?? null);
    }
  };

  const handleHeightChange = (v: string) => {
    if (v.length > 3) return;

    setHeight(v);
    setErrorHeight?.("");

    if (v.length >= 3) {
      setPendingAdvance(heightKey ?? null);
    }
  };

  const handleHeightBlur = () => {
    if (!height || height.trim() === "") return;

    const num = Number(height);
    if (isNaN(num)) return;

    const multiplied = String(num * 10);

    setHeight(multiplied);

    setPendingAdvance(heightKey ?? null);
  };

  return (
    <Box className="mt-3 space-y-2">
      {/* Layer Label */}
      <Text className="text-gray-700 font-semibold text-sm">{label}</Text>

      {/* Inputs Row */}
      <Box className="flex flex-row gap-2">
        {/* Amount */}
        <FormControl className="flex-1">
          <FormControlLabel>
            <FormControlLabelText size="xs">Amount</FormControlLabelText>
          </FormControlLabel>
          <Box className="relative">
            <Input size="sm" isDisabled={disabled}>
              <InputField
                ref={amountRef}
                value={amount}
                maxLength={maxLAmount}
                keyboardType="numeric"
                onChangeText={handleAmountChange}
                onSubmitEditing={() => setPendingAdvance(amountKey ?? null)}
                returnKeyType="next"
                submitBehavior="submit"
              />

              {showClearAmount && (
                <InputSlot
                  onPress={() => {
                    setAmount("");
                    setErrorAmount?.("");
                  }}
                >
                  <InputIcon as={CloseIcon} size="sm" className="text-gray-400 mr-2" />
                </InputSlot>
              )}
            </Input>
          </Box>
          {errorAmount && (
            <FormControlError>
              <FormControlErrorIcon as={MessageCircleWarningIcon} />
              <FormControlErrorText>{errorAmount}</FormControlErrorText>
            </FormControlError>
          )}
        </FormControl>

        {/* Type */}
        <FormControl className="flex-1">
          <FormControlLabel>
            <FormControlLabelText size="xs">Type</FormControlLabelText>
          </FormControlLabel>
          <Box className="relative">
            <Input size="sm" isDisabled={disabled}>
              <InputField
                ref={typeRef}
                value={type}
                maxLength={maxLType}
                keyboardType="numeric"
                onChangeText={handleTypeChange}
                onSubmitEditing={() => setPendingAdvance(typeKey ?? null)}
                returnKeyType="next"
                submitBehavior="submit"
              />
              {showClearType && (
                <InputSlot
                  onPress={() => {
                    setType("");
                    setErrorType?.("");
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <InputIcon as={CloseIcon} size="sm" className="text-gray-400" />
                </InputSlot>
              )}
            </Input>
          </Box>
          {errorType && (
            <FormControlError>
              <FormControlErrorIcon as={MessageCircleWarningIcon} />
              <FormControlErrorText>{errorType}</FormControlErrorText>
            </FormControlError>
          )}
        </FormControl>

        {/* Height */}
        <FormControl className="flex-1">
          <FormControlLabel>
            <FormControlLabelText size="xs">Height</FormControlLabelText>
          </FormControlLabel>
          <Box className="relative">
            <Input size="sm" isDisabled={disabled}>
              <InputField
                ref={heightRef}
                value={height}
                maxLength={4}
                keyboardType="numeric"
                onChangeText={handleHeightChange}
                onBlur={handleHeightBlur}
                onSubmitEditing={() => setPendingAdvance(heightKey ?? null)}
                returnKeyType="next"
               submitBehavior="submit"
              />
              {showClearHeight && (
                <InputSlot
                  onPress={() => {
                    setHeight("");
                    setErrorHeight?.("");
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <InputIcon as={CloseIcon} size="sm" className="text-gray-400" />
                </InputSlot>
              )}
            </Input>
          </Box>
          {errorHeight && (
            <FormControlError>
              <FormControlErrorIcon as={MessageCircleWarningIcon} />
              <FormControlErrorText>{errorHeight}</FormControlErrorText>
            </FormControlError>
          )}
        </FormControl>
      </Box>
    </Box>
  );
}