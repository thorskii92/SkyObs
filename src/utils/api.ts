import { getApiBaseUrl } from "../config/env";
import { SynopData } from "../models/synop_data";
import { get24HoursAgo, get3HoursAgo } from "./time";

export const API_URL = getApiBaseUrl();

export const getStations = async () => {
    try {
        const response = await fetch(`${API_URL}/stations`);

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

export const getStationByID = async (stnId: Number) => {
    try {
        const response = await fetch(`${API_URL}/stations/${stnId}`);

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

export const saveSynopData = async (synopData: SynopData) => {
    try {
        const response = await fetch(`${API_URL}/synop_data`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(synopData),
        });

        const data = await response.json();

        console.log(data)

        if (!response.ok) {
            throw new Error(data.error || data.message || "Failed to update SYNOP data");
        }

        return data;
    } catch (error) {
        console.error("saveSynopData error:", error);
        return null;
    }
};

export const getPsychrometric = async (
    dBulb: string,
    wBulb: string
) => {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => {
            controller.abort();
        }, 10000); // 10 second timeout

        const response = await fetch(
            `${API_URL}/psychrometric?dBulb=${encodeURIComponent(dBulb)}&wBulb=${encodeURIComponent(wBulb)}`,
            { signal: controller.signal }
        );

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

        return null; // Let fallback handle it
    }
};

export const get3hrAgoSynopData = async (date: string, time: string): Promise<any[] | null> => {
    try {
        const past3hr = get3HoursAgo(date, time);
        const response = await fetch(`${API_URL}/synop_data?sDate=${past3hr.date}&sHour=${past3hr.time}`);

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

        const response = await fetch(`${API_URL}/synop_data?sDate=${past24hr.date}&sHour=${past24hr.time}`);

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
