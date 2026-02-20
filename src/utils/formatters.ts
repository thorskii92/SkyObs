export const formatTemp = (value: string): string => {
    try {
        if (!value) return value;

        // only format if exactly 3 digits and numeric
        if (value.length === 3 && /^\d{3}$/.test(value)) {
            return (Number(value) * 0.1).toFixed(1);
        }

        return value;
    } catch {
        return value; // fail-safe
    }
};

export const formatRH = (value: string): string => {
    try {
        if (!value) return value;

        if (value.length === 2 && /^\d{2}$/.test(value)) {
            return Number(value).toFixed(1)
        }

        return value;
    } catch {
        return value; // fail-safe
    }
}

export const formatPres = (value: string): string => {
    try {
        if (!value) return value;

        if (value.length === 3 && /^\d{3}$/.test(value)) {
            const num = Number(value);

            if (num < 500) {
                return ((num + 10000) * 0.1).toFixed(1);
            }

            return ((num + 9000) * 0.1).toFixed(1);
        }

        return value;
    } catch {
        return value; // fail-safe
    }
};
