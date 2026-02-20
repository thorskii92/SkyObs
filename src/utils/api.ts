import { getApiBaseUrl } from "../config/env";
import { SynopData } from "../models/synop_data";
import { get24HoursAgo, get3HoursAgo } from "./time";

const API_URL = getApiBaseUrl();

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

export const getPsychrometric = async (dBulb: string, wBulb: string) => {
    try {
        const response = await fetch(`${API_URL}/psychrometric?dBulb=${dBulb}&wBulb=${wBulb}`);


        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json()

        if (!json.results || json.results.length === 0) return null

        const psychroData = json.results[0];

        return psychroData;
    } catch (error) {
        console.error(error);
        return null
    }
}

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
