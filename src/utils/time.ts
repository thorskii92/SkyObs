function formatTime(date: Date) {
    // Converts a Date object to 'yyyy-mm-dd' and 'HHMM' format
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const HH = String(date.getHours()).padStart(2, '0');
    const MM = String(date.getMinutes()).padStart(2, '0');
    return {
        date: `${yyyy}-${mm}-${dd}`,
        time: `${HH}${MM}`
    };
}

function getPastDateTime(dateStr: string, timeStr: string, hoursAgo: number) {
    // Parse input
    const year = parseInt(dateStr.slice(0, 4));
    const month = parseInt(dateStr.slice(5, 7)) - 1; // JS months are 0-based
    const day = parseInt(dateStr.slice(8, 10));
    const hours = parseInt(timeStr.slice(0, 2));
    const minutes = parseInt(timeStr.slice(2, 4));

    const date = new Date(year, month, day, hours, minutes);
    date.setHours(date.getHours() - hoursAgo);

    return formatTime(date);
}

export const get3HoursAgo = (date: string, time: string) => { return getPastDateTime(date, time, 3) };
export const get24HoursAgo = (date: string, time: string) => { return getPastDateTime(date, time, 24) };
