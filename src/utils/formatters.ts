export const formatTemp = (value: string, reverse: boolean = false): string => {
    if (!value) return value;

    if (!reverse) {
        const num = Number(value);
        if (!isNaN(num)) {
            // If already decimal, normalize to 1 decimal
            if (value.includes(".")) return num.toFixed(1);
            // If 3-digit raw code, e.g., "253" -> 25.3
            if (/^\d{3}$/.test(value)) return (num * 0.1).toFixed(1);
        }
        return value;
    } else {
        const num = Number(value);
        if (!isNaN(num)) return Math.round(num * 10).toString().padStart(3, "0");
        return value;
    }
};

export const formatPres = (value: string, reverse: boolean = false): string => {
    if (!value) return value;

    if (!reverse) {
        const num = Number(value);
        if (!isNaN(num)) {
            if (value.includes(".")) return num.toFixed(1);

            if (/^\d{3}$/.test(value)) {
                const adjusted = num < 500 ? num + 10000 : num + 9000;
                return (adjusted * 0.1).toFixed(1);
            }
        }
        return value;
    } else {
        const num = Number(value);
        if (!isNaN(num)) {
            const scaled = Math.round(num * 10);
            const code = scaled >= 10000 ? scaled - 10000 : scaled - 9000;
            return code.toString().padStart(3, "0");
        }
        return value;
    }
};

export const formatNet3hr = (value: string): string => {
    if (!value) return value;

    const num = Number(value);
    if (isNaN(num)) return value;

    return value.includes(".") ? num.toFixed(1) : (num / 10).toFixed(1);
};

export const formatPres24 = (value: string): string => {
    if (!value) return "";

    const num = Number(value);
    if (isNaN(num)) return "";

    return value.includes(".") ? num.toFixed(1) : (num / 10).toFixed(1);
};

export const formatVaporP = (value: string): string => {
    if (!value) return "";

    const num = Number(value);
    if (isNaN(num)) return "";

    return value.includes(".") ? num.toFixed(2) : (num / 100).toFixed(2);
};

export const formatRH = (value: string, reverse: boolean = false): string => {
    if (!value) return value;

    if (!reverse) {
        const num = Number(value);
        if (!isNaN(num)) return num.toFixed(1);
        return value;
    } else {
        const num = Number(value);
        if (!isNaN(num)) return Math.round(num).toString().padStart(2, "0");
        return value;
    }
};

export const formatWind = (value: string, reverse: boolean = false): string => {
    if (!value) return "";

    const num = Number(value);

    if (isNaN(num)) return value;

    if (!reverse) {
        // Normal formatting: just pad to 3 digits
        return Math.round(num).toString().padStart(3, "0");
    } else {
        // Reverse formatting: e.g., "005" -> 5
        return Math.round(num).toString();
    }
};

// DATE FORMATTER
export const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // months are 0-based
    const day = date.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
};

// ISO DATE FORMATTER (YYYY-MM-DDT00:00:00.000Z)
export const formatDateUTC = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");

    return `${year}-${month}-${day}T00:00:00.000Z`;
};