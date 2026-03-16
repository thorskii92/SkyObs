export const formatTemp = (value: string, reverse: boolean = false): string => {
    try {
        if (!value) return value;

        if (!reverse) {
            // normal formatting: "253" -> 25.3
            if (value.length === 3 && /^\d{3}$/.test(value)) {
                return (Number(value) * 0.1).toFixed(1);
            }
            return value;
        } else {
            // reverse formatting: "25.3" -> "253"
            const num = Number(value);
            if (!isNaN(num)) {
                return Math.round(num * 10)
                    .toString()
                    .padStart(3, "0");
            }
            return value;
        }
    } catch {
        return value; // fail-safe
    }
};

export const formatRH = (value: string, reverse: boolean = false): string => {
    try {
        if (!value) return value;

        if (!reverse) {
            // normal formatting: "45" -> 45.0
            if (value.length === 2 && /^\d{2}$/.test(value)) {
                return Number(value).toFixed(1);
            }
        } else {
            // reverse formatting: "45.0" -> "45"
            const num = Number(value);
            if (!isNaN(num)) {
                return Math.round(num).toString().padStart(2, "0");
            }
        }

        return value;
    } catch {
        return value;
    }
};

export const formatPres = (value: string, reverse: boolean = false): string => {
    try {
        if (!value) return value;

        if (!reverse) {
            // normal formatting: "234" -> pressure in hPa
            if (value.length === 3 && /^\d{3}$/.test(value)) {
                const num = Number(value);

                if (num < 500) {
                    return ((num + 10000) * 0.1).toFixed(1);
                } else {
                    return ((num + 9000) * 0.1).toFixed(1);
                }
            }
        } else {
            // reverse formatting: hPa -> SYNOP 3-digit code
            const num = Number(value);
            if (!isNaN(num)) {
                const scaled = Math.round(num * 10);
                if (scaled >= 10000) {
                    return (scaled - 10000).toString().padStart(3, "0");
                } else {
                    return (scaled - 9000).toString().padStart(3, "0");
                }
            }
        }

        return value;
    } catch {
        return value;
    }
};


export const formatNet3hr = (value: string): string => {
    // Ensure it's numeric
    const num = Number(value);
    if (isNaN(num)) return value; // fallback if not a number

    // Convert to 'xx.x' format
    const formatted = (num / 10).toFixed(1);
    return formatted;
};


export const formatPres24 = (value: string): string => {
    if (!value) return "";

    // Check for sign
    const isNegative = value.startsWith("-");
    const raw = isNegative ? value.slice(1) : value;

    if (raw.length < 3) {
        // not enough digits to format
        return value;
    }

    // Insert decimal before last digit
    const formatted = raw.slice(0, raw.length - 1) + "." + raw.slice(-1);

    return isNegative ? "-" + formatted : formatted;
};

export const formatVaporP = (value: string): string => {
    if (!value) return "";

    // Ensure at least 4 digits
    const padded = value.padStart(4, "0");

    const formatted = padded.slice(0, 2) + "." + padded.slice(2) + "0";

    return formatted;
};

// DATE FORMATTER
export const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // months are 0-based
    const day = date.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
};