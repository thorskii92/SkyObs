import { getApiBaseUrl } from "../config/env";
import { SynopData } from "../models/synop_data";
import { get24HoursAgo, get3HoursAgo } from "./time";

export const API_URL = getApiBaseUrl();

export const checkApiConnection = async (): Promise<boolean> => {
    try {
        const controller = new AbortController();

        const timeout = setTimeout(() => {
            controller.abort();
        }, 60000); // 1 minute timeout

        const response = await fetch(`${API_URL}`, {
            method: "GET",
            signal: controller.signal,
        });

        clearTimeout(timeout);

        return response.ok; // true if 200–299
    } catch (error: any) {
        if (error.name === "AbortError") {
            console.warn("API connection timed out");
        } else {
            console.warn("API connection failed:", error.message);
        }

        return false;
    }
};

export const getStations = async () => {
    try {
        const response = await fetch(`${API_URL}/api/stations`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();

        const stations = json.results;

        return stations;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export const getStationByID = async (stnId: number) => {
    try {
        const response = await fetch(`${API_URL}/api/stations/${stnId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();

        if (!json.results || json.results.length === 0) return null

        const station = json.results[0];

        return station;
    } catch (error) {
        console.error(error);
        return null;
    }
}

interface SynopQueryParams {
    startDate?: string;     // YYYY-MM-DD
    endDate?: string;       // YYYY-MM-DD
    sDate?: string;         // Exact date YYYY-MM-DD
    sHour?: string | number;
    stnId?: string | number;
    page?: number;          // Default 1
    limit?: number;         // Default 500
    sortBy?: 'sDate' | 'sHour' | 'stnId';
    sortOrder?: 'asc' | 'desc';
}

export const getSynopData = async (params: SynopQueryParams = {}) => {
    const {
        startDate,
        endDate,
        sDate,
        sHour,
        stnId,
        page = 1,
        limit = 500,
        sortBy = 'sDate',
        sortOrder = 'desc'
    } = params;

    const query = new URLSearchParams();

    // Date filters
    if (sDate) query.append('sDate', sDate);
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);

    if (sHour) query.append('sHour', sHour.toString());
    if (stnId) query.append('stnId', stnId.toString());

    // Only use pagination if NOT date range
    if (!(startDate && endDate)) {
        query.append('page', page.toString());
        query.append('limit', limit.toString());
    }

    query.append('sortBy', sortBy);
    query.append('sortOrder', sortOrder);

    const url = `${API_URL}/api/synop_data?${query.toString()}`;


    try {
        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Failed to fetch synop data");
        }

        return {
            results: data.results || [],
            pagination: data.pagination || null,
            filters: data.filters || null,
            sorting: data.sorting || null
        };
    } catch (error) {
        console.error("Error fetching synop data:", error);
        return { results: [], pagination: null, filters: null, sorting: null };
    }
};

export const getAllSynopData = async (): Promise<any[] | null> => {
    try {
        let allData: any[] = [];
        let page = 1;
        let totalPages = 1;

        const LIMIT = 100; // you can tune this (50–500 is ideal)

        do {
            const response = await fetch(
                `${API_URL}/api/synop_data?page=${page}&limit=${LIMIT}`
            );

            if (!response.ok) {
                throw new Error(`Failed on page ${page}`);
            }

            const json = await response.json();

            // Append results
            allData.push(...json.results);

            // Update total pages from API
            totalPages = json.pagination.totalPages;

            page++;
        } while (page <= totalPages);

        return allData;

    } catch (error) {
        console.error("getAllSynopData error:", error);
        return null;
    }
};

export const saveSynopData = async (synopData: SynopData) => {
    try {
        // Normalize dates for MySQL
        const payload = {
            ...synopData,
            sDate: synopData.sDate,           // "YYYY-MM-DD"
            sActualDateTime: synopData.sActualDateTime,
            summaryDate: synopData.summaryDate
        };

        const response = await fetch(`${API_URL}/api/synop_data`, {
            method: "POST", // can switch to PUT if you implement update logic
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || data.message || "Failed to save SYNOP data");
        }

        return data;
    } catch (error) {
        console.error("saveSynopData error:", error);
        return null;
    }
};

export const saveAerodromeData = async (aerodromeData: any) => {
    try {
        const response = await fetch(`${API_URL}/api/aerodrome`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(aerodromeData),
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 409) {
                // Already exists
                console.log("Aerodrome record already exists in API");
                return { success: true, message: "Already exists" };
            }
            throw new Error(data.error || "Failed to save aerodrome data");
        }

        return data;
    } catch (error) {
        console.error("saveAerodromeData error:", error);
        return null;
    }
};

export const getAerodromeData = async (params: {
    startDate?: string;
    endDate?: string;
    stnId?: string | number;
    page?: number;
    limit?: number;
} = {}) => {
    const {
        startDate,
        endDate,
        stnId,
        page = 1,
        limit = 500,
    } = params;

    const query = new URLSearchParams();

    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);
    if (stnId) query.append('stnId', stnId.toString());

    query.append('page', page.toString());
    query.append('limit', limit.toString());

    const url = `${API_URL}/api/aerodrome?${query.toString()}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Failed to fetch aerodrome data");
        }

        return {
            results: data.results || [],
            pagination: data.pagination || null,
        };
    } catch (error) {
        console.error("Error fetching aerodrome data:", error);
        return { results: [], pagination: null };
    }
};

export const getPsychrometric = async (
    dBulb?: string,
    wBulb?: string
) => {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

        // Build query string dynamically
        const params = new URLSearchParams();
        if (dBulb !== undefined) params.append("dBulb", dBulb);
        if (wBulb !== undefined) params.append("wBulb", wBulb);

        const queryString = params.toString();
        const url = `${API_URL}/api/psychrometric${queryString ? `?${queryString}` : ""}`;

        const response = await fetch(url, { signal: controller.signal });

        clearTimeout(timeout);

        if (!response.ok) {
            console.warn("API responded with status:", response.status);
            return null;
        }

        const json = await response.json();

        if (!json?.results?.length) return null;

        return json.results[0];

    } catch (error: any) {
        if (error.name === "AbortError") {
            console.warn("API request timed out");
        } else {
            console.warn("Network/API error:", error.message);
        }

        return null; // fallback
    }
};

export const loginUser = async (username: string, password: string) => {
    try {
        // Send plain credentials; backend will decrypt and compare
        const response = await fetch(`${API_URL}/api/systemusers/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Login failed");
        }

        const data = await response.json();
        const userData = { ...data.user };
        return userData;
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
};

export const get3hrAgoSynopData = async (date: string, time: string): Promise<any[] | null> => {
    try {
        const past3hr = get3HoursAgo(date, time);
        const response = await fetch(`${API_URL}/api/synop_data?sDate=${past3hr.date}&sHour=${past3hr.time}`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        const synopData = data["results"];

        return synopData;
    } catch (error) {
        console.error("get3hrAgoSynopData error:", error);
        return null;
    }
};

export const get24hrAgoSynopData = async (date: string, time: string): Promise<any[] | null> => {
    try {
        const past24hr = get24HoursAgo(date, time);

        const response = await fetch(`${API_URL}/api/synop_data?sDate=${past24hr.date}&sHour=${past24hr.time}`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        const synopData = data["results"];

        return synopData;
    } catch (error) {
        console.error("get3hrAgoSynopData error:", error);
        return null;
    }
};

// UPDATE (PATCH) user profile
export const updateUserProfile = async (
    userId: number,
    updates: {
        fullName?: string;
        userType?: string;
        status?: string;
        default_station_id?: number;
    }
) => {
    try {
        const response = await fetch(`${API_URL}/api/systemusers/${userId}`, {
            method: "PATCH", // partial update
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(updates),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to update user");
        }

        return data;
    } catch (error) {
        console.error("updateUserProfile error:", error);
        return null;
    }
};

export const changeUserPassword = async (
    userId: number,
    currentPassword: string,
    newPassword: string
) => {
    try {
        const response = await fetch(`${API_URL}/api/systemusers/${userId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                currentPassword, // optional (if backend validates later)
                sPass: newPassword,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to change password");
        }

        return data;
    } catch (error) {
        console.error("changeUserPassword error:", error);
        return null;
    }
};


interface SunshineQueryParams {
    sDate?: string;
    stnId?: string | number;
}

export const getSunshineDuration = async (params: SunshineQueryParams = {}) => {
    const query = new URLSearchParams();

    if (params.sDate) query.append('sDate', params.sDate);
    if (params.stnId) query.append('stnId', params.stnId.toString());

    const url = `${API_URL}/api/sunshine_duration?${query.toString()}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Failed to fetch sunshine duration');
        }

        // Return the first result (exact date + stationID expected to be unique)
        return data.results?.[0] ?? null;
    } catch (error) {
        console.error('getSunshineDuration error:', error);
        return null;
    }
};

// =====================================================
// SMS RECIPIENTS API
// =====================================================

export const getSmsRecipientsAPI = async () => {
    try {
        const response = await fetch(`${API_URL}/api/sms_recipients`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const json = await response.json();
        return json.results || [];
    } catch (error) {
        console.error("getSmsRecipientsAPI error:", error);
        return null;
    }
};

export const upsertSmsRecipientAPI = async (payload: {
    stnId: number;
    uId?: number | null;
    cID?: number | null;    // optional fallback if cName not provided
    cName?: string | null;  // new
    num: string;
    name?: string | null;
}) => {
    try {
        const response = await fetch(`${API_URL}/api/sms_recipients`, {
            method: "POST", // now acts as UPSERT
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || "Failed to upsert recipient");

        return data;
    } catch (error) {
        console.error("upsertSmsRecipientAPI error:", error);
        return null;
    }
};

export const deleteSmsRecipientAPI = async (payload: {
    num: string;
    cID?: number | null;
    cName?: string | null;
    name?: string | null;
}) => {
    try {
        const response = await fetch(`${API_URL}/api/sms_recipients`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || "Failed to delete recipient");

        return data;
    } catch (error) {
        console.error("deleteSmsRecipientAPI error:", error);
        return null;
    }
};

// =====================================================
// CATEGORY API
// =====================================================

export const getCategories = async () => {
    try {
        const response = await fetch(`${API_URL}/api/category`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const json = await response.json();
        return json.results || [];
    } catch (error) {
        console.error("getCategories error:", error);
        return null;
    }
};

// =====================================================
// CODE TEMPLATE API
// =====================================================

export const getCodeTemplates = async (params: {
    stnId?: number | string;
    cID?: number | string;
    page?: number;
    limit?: number;
} = {}) => {
    const {
        stnId,
        cID,
        page = 1,
        limit = 500,
    } = params;

    const query = new URLSearchParams();
    if (stnId) query.append('stnId', stnId.toString());
    if (cID) query.append('cID', cID.toString());
    query.append('page', page.toString());
    query.append('limit', limit.toString());

    const url = `${API_URL}/api/codetemplate?${query.toString()}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to fetch code templates");

        return {
            results: data.results || [],
            pagination: data.pagination || null,
        };
    } catch (error) {
        console.error("getCodeTemplates error:", error);
        return { results: [], pagination: null };
    }
};

export const saveCodeTemplate = async (template: any) => {
    try {
        const payload = { ...template };

        // Ensure MySQL/SQLite datetime format
        if (payload.dateadded && typeof payload.dateadded === 'string') {
            payload.dateadded = payload.dateadded.replace('T', ' ').split('.')[0];
        }
        if (payload.dateupdated && typeof payload.dateupdated === 'string') {
            payload.dateupdated = payload.dateupdated.replace('T', ' ').split('.')[0];
        }

        // Always use PUT now since we are updating/creating by unique fields
        const url = `${API_URL}/api/codetemplate`;

        const response = await fetch(url, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to save code template");
        }

        return data;
    } catch (error) {
        console.error("saveCodeTemplate error:", error);
        return null;
    }
};

export const deleteCodeTemplate = async (stnID: number, tType: string, hour?: string | null) => {
    try {
        const payload = {
            stnID,
            tType,
            hour: hour || null
        };

        const response = await fetch(`${API_URL}/api/codetemplate`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Failed to delete code template");
        }

        return { success: true };
    } catch (error) {
        console.error("deleteCodeTemplate error:", error);
        return null;
    }
};
// =====================================================
// CODE PARAMETER API
// =====================================================

export const getCodeParameters = async (params: {
    stnId?: number | string;
    cID?: number | string;
    page?: number;
    limit?: number;
} = {}) => {
    const {
        stnId,
        cID,
        page = 1,
        limit = 500,
    } = params;

    const query = new URLSearchParams();
    if (stnId) query.append('stnId', stnId.toString());
    if (cID) query.append('cID', cID.toString());
    query.append('page', page.toString());
    query.append('limit', limit.toString());

    const url = `${API_URL}/api/codeparameter?${query.toString()}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to fetch code parameters");

        return {
            results: data.results || [],
            pagination: data.pagination || null,
        };
    } catch (error) {
        console.error("getCodeParameters error:", error);
        return { results: [], pagination: null };
    }
};

export const saveCodeParameter = async (parameter: any) => {
    try {
        // Convert ISO datetime to MySQL format (YYYY-MM-DD HH:MM:SS)
        const payload = { ...parameter };
        if (payload.dateadded && typeof payload.dateadded === 'string') {
            payload.dateadded = payload.dateadded.replace('T', ' ').split('.')[0];
        }
        if (payload.dateupdated && typeof payload.dateupdated === 'string') {
            payload.dateupdated = payload.dateupdated.replace('T', ' ').split('.')[0];
        }

        const response = await fetch(`${API_URL}/api/codeparameter`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (!response.ok) {
            if (response.status === 409) {
                console.log("Code parameter already exists in API");
                return { success: true, message: "Already exists" };
            }
            throw new Error(data.error || "Failed to save code parameter");
        }

        return data;
    } catch (error) {
        console.error("saveCodeParameter error:", error);
        return null;
    }
};

// =====================================================
// PSYCHROMETRIC LOOKUP DATA API
// =====================================================

export const getPsychrometricData = async () => {

    const url = `${API_URL}/api/psychrometric`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to fetch psychrometric data");

        return {
            results: data.results || [],
            pagination: data.pagination || null,
        };
    } catch (error) {
        console.error("getPsychrometricData error:", error);
        return { results: [], pagination: null };
    }
};

export const savePsychrometricData = async (psychData: any) => {
    try {
        const response = await fetch(`${API_URL}/api/psychrometric`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(psychData),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to save psychrometric data");

        return data;
    } catch (error) {
        console.error("savePsychrometricData error:", error);
        return null;
    }
};