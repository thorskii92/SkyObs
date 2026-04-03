export const normalizeDate = (input: string | Date): Date => {
    if (input instanceof Date) return input;

    // Handles ISO strings like "2025-01-04T00:00:00.000Z"
    return new Date(input);
};
