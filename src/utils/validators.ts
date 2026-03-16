import { getDB, getLSynopData } from "./db";


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
    net3hrSign?: number | null
): ValidationResult => {
    return validateField(tendency, "Tendency", {
        numeric: true,
        customFn: (v: string) => {
            // If net3hr is not provided, skip cross-field validation
            if (!net3hrSign) {
                return { isValid: true, error: "" };
            }

            const a = Number(v);
            const x = Number(net3hrSign);

            console.log(net3hrSign)
            console.log(a);

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


export const validateMaxTemp = async (
    stnID: number | string,
    sDate: string,
    sHour: string,
    maxTempInput: string,
    currentDBulbInput: string
): Promise<ValidationResult> => {
    try {
        // Convert input strings to numbers
        const maxTemp = maxTempInput === "" ? null : Number(maxTempInput);
        const currentDBulb = currentDBulbInput === "" ? null : Number(currentDBulbInput);

        // Skip validation if maxTemp is blank
        if (maxTemp === null) return { isValid: true, error: "" };

        const db = await getDB();

        const hoursToCheck = Array.from({ length: 6 }, (_, i) => {
            let h = Number(sHour) - i;
            if (h < 0) h += 24;
            return h.toString().padStart(2, "0");
        });

        const results = await Promise.all(
            hoursToCheck.map(h => getLSynopData(db, stnID, h, sDate))
        );

        const synopData = results.flat();

        const dryBulbs = synopData
            .map(d => d.dBulb)
            .filter(d => d !== undefined && d !== null) as number[];

        if (currentDBulb !== null) dryBulbs.push(currentDBulb);

        const highestDB = dryBulbs.length ? Math.max(...dryBulbs) : null;

        if (highestDB !== null && maxTemp < highestDB)
            return { isValid: false, error: "Max. temperature must be ≥ dry bulbs in last 6 hrs." };

        return { isValid: true, error: "" };
    } catch (error) {
        console.error("Error validating maxTemp:", error);
        return { isValid: true, error: "" };
    }
};

export const validateMinTemp = async (
    stnID: number | string,
    sDate: string,
    sHour: string,
    minTempInput: string,
    currentDBulbInput: string
): Promise<ValidationResult> => {
    try {
        const minTemp = minTempInput === "" ? null : Number(minTempInput);
        const currentDBulb = currentDBulbInput === "" ? null : Number(currentDBulbInput);

        if (minTemp === null) return { isValid: true, error: "" };

        const db = await getDB();

        const hoursToCheck = Array.from({ length: 6 }, (_, i) => {
            let h = Number(sHour) - i;
            if (h < 0) h += 24;
            return h.toString().padStart(2, "0");
        });

        const results = await Promise.all(
            hoursToCheck.map(h => getLSynopData(db, stnID, h, sDate))
        );

        const synopData = results.flat();

        const dryBulbs = synopData
            .map(d => d.dBulb)
            .filter(d => d !== undefined && d !== null) as number[];

        if (currentDBulb !== null) dryBulbs.push(currentDBulb);

        const lowestDB = dryBulbs.length ? Math.min(...dryBulbs) : null;

        if (lowestDB !== null && minTemp > lowestDB)
            return { isValid: false, error: "Min. temperature must be ≤ dry bulbs in last 6 hrs." };

        return { isValid: true, error: "" };
    } catch (error) {
        console.error("Error validating minTemp:", error);
        return { isValid: true, error: "" };
    }
};

// TODO: clouds <= summTotal
export const validateClouds = (
    cloudAmount?: number,
    summTotal?: number
): ValidationResult => {
    if (cloudAmount === undefined || summTotal === undefined) return { isValid: true, error: "" };

    if (cloudAmount > summTotal) {
        return { isValid: false, error: "Cloud coverage cannot exceed total sum (summTotal)" };
    }

    return { isValid: true, error: "" };
};
