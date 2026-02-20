export type ValidationResult = {
    isValid: boolean;
    error: string;
};

/** Base validators */
export const isRequired = (value?: string, fieldName?: string): ValidationResult => {
    if (value === undefined || value === null || value.trim() === "") {
        return { isValid: false, error: `${fieldName ?? "This field"} is required` };
    }
    return { isValid: true, error: "" };
};

export const isNumeric = (value?: string, fieldName?: string): ValidationResult => {
    if (!value) return { isValid: true, error: "" };
    if (!/^-?\d*\.?\d+$/.test(value)) {
        return { isValid: false, error: `${fieldName ?? "Value"} must be numeric` };
    }
    return { isValid: true, error: "" };
};

export const matchesRegex = (value: string, regex: RegExp, errorMessage: string): ValidationResult => {
    if (!regex.test(value)) return { isValid: false, error: errorMessage };
    return { isValid: true, error: "" };
};

/** Universal validator: required + numeric + regex + customFn */
export const validateField = (
    value?: string,
    fieldName?: string,
    options?: {
        required?: boolean;
        numeric?: boolean;
        regex?: { pattern: RegExp; message: string };
        customFn?: (value: string) => ValidationResult;
    }
): ValidationResult => {
    if (options?.required) {
        const req = isRequired(value, fieldName);
        if (!req.isValid) return req;
    }

    if (options?.numeric) {
        const num = isNumeric(value, fieldName);
        if (!num.isValid) return num;
    }

    if (options?.regex && value) {
        const regexResult = matchesRegex(value, options.regex.pattern, options.regex.message);
        if (!regexResult.isValid) return regexResult;
    }

    if (options?.customFn && typeof options.customFn === "function" && value) {
        return options.customFn(value || "");
    }

    return { isValid: true, error: "" };
};

export const isTendencyValid = (
    tendency?: string,
    rawNet3hr?: string | null
): ValidationResult => {
    return validateField(tendency, "Tendency", {
        required: true,
        numeric: true,
        customFn: (v: string) => {
            // If net3hr is not provided, skip cross-field validation
            if (!rawNet3hr) {
                return { isValid: true, error: "" };
            }

            const a = Number(v);
            const x = Number(rawNet3hr);

            switch (a) {
                case 0:
                    if (x < 0)
                        return { isValid: false, error: "For tendency 0, Net 3-hr must be ≥ 0" };
                    break;

                case 1:
                case 2:
                case 3:
                    if (x <= 0)
                        return { isValid: false, error: "For tendency 1–3, Net 3-hr must be > 0" };
                    break;

                case 4:
                    if (x !== 0)
                        return { isValid: false, error: "For tendency 4, Net 3-hr must be exactly 0" };
                    break;

                case 5:
                    if (x > 0)
                        return { isValid: false, error: "For tendency 5, Net 3-hr must be ≤ 0" };
                    break;

                case 6:
                case 7:
                case 8:
                    if (x >= 0)
                        return { isValid: false, error: "For tendency 6–8, Net 3-hr must be < 0" };
                    break;

                default:
                    return {
                        isValid: false,
                        error: "Invalid tendency value",
                    };
            }

            return { isValid: true, error: "" };
        },
    });
};
