import { SQLiteDatabase } from "expo-sqlite";
import { getSunshineDuration } from "./api";
import { getLAerodromeData, getLCodeParams, getLCodeTemplate } from "./db";
import { formatRH, formatTemp } from "./formatters";

interface Category {
    cID: number;
    cName: string;
}

function getRainIndicator(RR: string, sHour: string): number {
    const rainAmount = Number(RR);

    const isTrace = rainAmount > 0 && rainAmount < 0.1; // define trace threshold

    if (["0000", "0600", "1200", "1800"].includes(sHour)) {
        if (isTrace || rainAmount >= 0.1) return 1; // rain
        return 3; // no rain
    } else if (["0300", "0900", "1500", "2100"].includes(sHour)) {
        if (isTrace || rainAmount >= 0.1) return 2; //  rain
        return 3; // no rain
    } else {
        return 4; // unknown / other hours
    }
}

function getWeatherIndicator(presW: string, pastW1: string, pastW2: string, sHour: string): number {
    if ((Number(presW) > 3) || (Number(pastW1) > 2) || (Number(pastW2) > 2)) return 1;

    return 2;
}

function getVVCode(VV: string): string {
    const numVV = Number(VV);

    if (isNaN(numVV) || numVV < 0) return "";

    // 0–5 km → 00–50
    if (numVV >= 0 && numVV <= 5) {
        return String(numVV * 10).padStart(2, "0");
    }

    // 6–30 km → 56–80
    if (numVV > 5 && numVV <= 30) {
        return String(numVV + 50);
    }

    // 35–75 km → 81–89
    if (numVV >= 35 && numVV <= 75 && numVV % 5 === 0) {
        const code = 81 + ((numVV - 35) / 5);
        return String(code);
    }

    return "";
}

function getHourlyRain(RR: string, sHour: string): string {
    const rrNum = Number(RR);

    if (["0000", "0600", "1200", "1800"].includes(sHour)) return "";

    if (isNaN(rrNum) || rrNum <= 0) return "";

    let newRR = "";

    if (rrNum === 0.01) {
        newRR = "990";
    } else if (rrNum < 1) {
        newRR = Math.round(rrNum * 10).toString().padStart(3, "0");
    } else {
        newRR = Math.round(rrNum).toString().padStart(3, "0");
    }

    return `6${newRR}1`;
}

function getCloudCode(cloudType: string): number {
    switch (Number(cloudType)) {
        case 11:
        case 12:
        case 18:
            return 8;
        case 13:
        case 19:
            return 9;
        case 14:
        case 15:
            return 6;
        case 16:
        case 17:
            return 7;
        case 21:
        case 22:
            return 4;
        case 23:
        case 24:
        case 25:
        case 26:
        case 27:
        case 28:
        case 29:
            return 3;
        case 31:
        case 32:
        case 33:
        case 34:
        case 35:
        case 36:
            return 0;
        case 37:
        case 38:
            return 2;
        case 39:
            return 1;
        default:
            return 0;
    }
}

function convertHeightCode(height: string): string {
    const h = Number(height);

    if (isNaN(h)) return "00"; // invalid input fallback

    let code = 0;

    if (h < 30) {
        code = 0;
    } else if (h >= 30 && h <= 1500) {
        code = Math.floor(h / 30);
    } else if (h >= 1800 && h <= 9000) {
        code = Math.floor((h - 1800) / 300 + 56);
    } else {
        code = 0;
    }

    return code.toString().padStart(2, "0"); // equivalent of ToString("00")
}

function getCloudTypeCode(
    getLowCount: string,
    get1LType: string,
    get2LType: string,
    get3LType: string,
    get4LType: string
): string {
    let result = "80000";

    // Convert cloud types to numbers
    const cloudTypes = [get1LType, get2LType, get3LType, get4LType].map((v) =>
        Number(v) || 0
    );

    let lowGenus = "0";
    let midGenus = "0";
    let highGenus = "0";

    // Low clouds (10–19)
    for (const cloudVal of cloudTypes) {
        if (cloudVal >= 10 && cloudVal < 20) {
            lowGenus = String(cloudVal % 10);
            break;
        }
    }

    // Mid clouds (20–29)
    for (const cloudVal of cloudTypes) {
        if (cloudVal >= 20 && cloudVal < 30) {
            midGenus = String(cloudVal % 10);
            break;
        }
    }

    // High clouds (30–39)
    for (const cloudVal of cloudTypes) {
        if (cloudVal >= 30 && cloudVal < 40) {
            highGenus = String(cloudVal % 10);
            break;
        }
    }

    const lowCountDigit = String(Number(getLowCount) || 0);
    result = `8${lowCountDigit}${lowGenus}${midGenus}${highGenus}`;

    return result;
}

function getWeatherGroup(
    wIndc: string,
    presW: string,
    pastW1: string,
    pastW2: string
): string {
    if (wIndc !== "1") return ""; // only code if weather indicator is 1

    // Ensure present weather is a number, formatted as 2 digits
    const presNum = Number(presW);
    const presFormatted = isNaN(presNum) ? "00" : presNum.toString().padStart(2, "0");

    // Default past weather codes to "0" if missing
    const past1 = pastW1 || "0";
    const past2 = pastW2 || "0";

    return `7${presFormatted}${past1}${past2}`;
}

function getCloudGroup(
    l1Count: string, l1Type: string, l1Height: string,
    l2Count: string, l2Type: string, l2Height: string,
    l3Count: string, l3Type: string, l3Height: string,
    l4Count: string, l4Type: string, l4Height: string
): string {

    let cGroup = "";

    const layers = [
        { Count: Number(l1Count) || 0, Type: l1Type, Height: l1Height },
        { Count: Number(l2Count) || 0, Type: l2Type, Height: l2Height },
        { Count: Number(l3Count) || 0, Type: l3Type, Height: l3Height },
        { Count: Number(l4Count) || 0, Type: l4Type, Height: l4Height }
    ];

    const reportableCounts = [1, 3, 5];
    let startIndex = 0;

    for (const threshold of reportableCounts) {
        for (let i = startIndex; i < layers.length; i++) {

            const layer = layers[i];

            if (layer.Count >= threshold) {
                const generaCode = getCloudCode(layer.Type);
                const heightCode = convertHeightCode(layer.Height);

                const code =
                    "8" +
                    layer.Count +
                    generaCode +
                    heightCode.toString().padStart(2, "0");

                if (cGroup !== "") {
                    cGroup += " ";
                }

                cGroup += code;

                startIndex = i + 1;

                break;
            }
        }
    }

    return cGroup;
}

function getCodeDir(dir: string): number {
    if (!dir || dir.trim() === "") {
        return 0; // No cloud layer
    }

    const value = dir.toUpperCase().trim();

    if (value === "NONE") {
        return 9; // No direction
    }

    switch (value) {
        case "NE": return 1;
        case "E": return 2;
        case "SE": return 3;
        case "S": return 4;
        case "SW": return 5;
        case "W": return 6;
        case "NW": return 7;
        case "N": return 8;
        default: return 9; // fallback = no direction
    }
}

async function getRain24Group(
    db: SQLiteDatabase,
    stnID: string,
    summaryDate: string
): Promise<string> {

    const row = await db.getFirstAsync<{ RR24: number }>(
        `
        SELECT SUM(RR) as RR24
        FROM synop_data
        WHERE stnID = ?
        AND sHour IN ('0000','0600','1200','1800')
        AND summaryDate = ?
        `,
        [stnID, summaryDate]
    );

    const RR24 = Number(row?.RR24 ?? 0);

    if (RR24 <= 0) return "";

    let code = "";

    if (RR24 === 0.01) code = "990";
    else if (RR24 < 1) code = Math.round(RR24 * 10).toString().padStart(3, "0");
    else code = Math.round(RR24).toString().padStart(3, "0");

    return `6${code}4`;
}

export async function getSunshineGroup(
    stnID: string,
    sDate: string
): Promise<string> {

    // Fetch sunshine data via API
    const row = await getSunshineDuration({ stnId: stnID, sDate });

    if (!row) return "";

    let totalSunshine = 0;

    for (let i = 5; i <= 19; i++) {
        const val = Number(row[`s${i}`] ?? 0);
        totalSunshine += val
    }
    
    totalSunshine = totalSunshine / 60

    const code = Math.round(totalSunshine * 10)
        .toString()
        .padStart(3, "0");

    return `55${code}`;
}

async function getPrevMinTemp(
    db: SQLiteDatabase,
    stnID: string,
    summaryDate: string
): Promise<string> {

    const row = await db.getFirstAsync<{ mnT: number }>(
        `
        SELECT MIN(minTemp) as mnT
        FROM synop_data
        WHERE stnID=? AND summaryDate=?
        `,
        [stnID, summaryDate]
    );

    const minTemp = Number(row?.mnT ?? NaN);

    if (isNaN(minTemp)) return "";

    const code = Math.round(minTemp * 10)
        .toString()
        .padStart(3, "0");

    return `20${code}`;
}

async function getWeeklyRainRemark(
    db: SQLiteDatabase,
    sDate: string,
    stnID: string
): Promise<string> {

    const date = new Date(sDate);

    if (date.getUTCDay() !== 1) return ""; // Monday

    const start = new Date(date);
    start.setUTCDate(date.getUTCDate() - 7);

    const end = new Date(date);
    end.setUTCDate(date.getUTCDate() - 1);

    const row = await db.getFirstAsync<{ WRR: number }>(
        `
        SELECT SUM(RR) as WRR
        FROM synop_data
        WHERE summaryDate BETWEEN ? AND ?
        AND sHour IN ('0000','0600','1200','1800')
        AND stnID = ?
        `,
        [
            start.toISOString().slice(0, 10),
            end.toISOString().slice(0, 10),
            stnID
        ]
    );

    const weeklyRR = Number(row?.WRR ?? 0);

    return `Weekly RR(${start.toISOString().slice(0, 10)} to ${end.toISOString().slice(0, 10)}): ${weeklyRR.toFixed(1)}mm;`;
}

async function getMonthlyRainGroup(
    db: SQLiteDatabase,
    stnID: string,
    sDate: string
): Promise<string> {

    const date = new Date(sDate);

    if (date.getUTCDate() !== 1) return "";

    const prevMonth = new Date(date);
    prevMonth.setUTCMonth(date.getUTCMonth() - 1);

    const row = await db.getFirstAsync<{ total: number }>(
        `
        SELECT SUM(RR) as total
        FROM synop_data
        WHERE strftime('%m', summaryDate)=?
        AND strftime('%Y', summaryDate)=?
        AND sHour IN ('0000','0600','1200','1800')
        AND stnID = ?
        `,
        [
            String(prevMonth.getUTCMonth() + 1).padStart(2, "0"),
            prevMonth.getUTCFullYear(),
            stnID
        ]
    );

    const total = Number(row?.total ?? 0);

    if (total <= 0) return "";

    const code = Math.round(total * 10)
        .toString()
        .padStart(4, "0");

    return `6${code}`;
}

function get555Group(RR: string): string {
    const rain = Number(RR);

    if (isNaN(rain) || rain <= 0) return "";

    // Handle trace rainfall
    if (rain === 0.01) return "555 29999";

    const code = Math.round(rain * 10)
        .toString()
        .padStart(4, "0");

    return `555 2${code}`;
}

function formatWDir(wDir: string): string {
    if (!wDir || wDir.trim() === "") return "///";

    const padded = String(Number(wDir)).padStart(3, "0"); // ensure xxx
    return padded.slice(0, 2); // first 2 digits
}

function formatWSpd(wSpd: string): string {
    if (!wSpd || wSpd.trim() === "") return "///";

    const padded = String(Number(wSpd)).padStart(3, "0"); // ensure xxx
    return padded.slice(-2); // last 2 digits
}

function formatPressure(pres: string): string {
    return String(Number(pres) * 10).slice(-4)
}

function formatNet3hr(net3hr: string): string {
    if (!net3hr || isNaN(Number(net3hr))) return "///";
    const value = Math.round(Number(net3hr) * 10)
    return value.toString().padStart(3, "0");
}

function formatPres24(pres24: string): string {
    if (!pres24 || isNaN(Number(pres24))) return "";

    const num = Number(pres24);
    const value = Math.round(Math.abs(num) * 10); // absolute value for XXX

    // Prefix based on sign
    const prefix = num < 0 ? "59" : "58";

    return `${prefix}${value.toString().padStart(3, "0")}`;
}

export default async function generateCodeFromTemplate(
    db: SQLiteDatabase,
    stnID: string,
    hour: string,
    category: Category,
    obsData: Record<string, string | number>
): Promise<string> {
    try {
        // 1️⃣ Get template based on station, category ID, and hour
        const templateRow = await getLCodeTemplate(db, stnID, category.cID, hour); // assume a helper that queries by category.cID
        if (!templateRow) return "";

        let code: string = templateRow.Template;

        const codeParams = await getLCodeParams(db, stnID, category.cID);
        if (!codeParams || !codeParams.length) return "";

        let procData = { ...obsData };

        if (category.cName === "SYNOP") {
            if (hour === "00") {
                procData.RR24 = await getRain24Group(db, stnID, String(obsData.summaryDate ?? ""));
                procData.sunshine = await getSunshineGroup(stnID, String(obsData.summaryDate));

                procData.minTempPrev = await getPrevMinTemp(db, stnID, String(obsData.summaryDate ?? ""));
                procData.weeklyRemark = await getWeeklyRainRemark(db, obsData.summaryDate as string, stnID);
                procData.monthlyGroup = await getMonthlyRainGroup(db, stnID, obsData.summaryDate as string);
                procData.group555 = get555Group(String(obsData.RR));
            }

            procData.wmostn = `${obsData.wmoID}${obsData.stationID}`;
            procData.rainIndc = getRainIndicator(String(obsData.RR ?? ""), String(obsData.sHour ?? ""));
            procData.wpIndc = getWeatherIndicator(
                String(obsData.presW ?? ""),
                String(obsData.pastW1 ?? ""),
                String(obsData.pastW2 ?? ""),
                String(obsData.sHour ?? "")
            );

            procData.VV = obsData.VV == null ? "//" : getVVCode(String(obsData.VV));
            procData.wDir = formatWDir(String(obsData.wDir ?? ""));
            procData.wSpd = formatWSpd(String(obsData.wSpd ?? ""));
            procData.rainHourly = getHourlyRain(String(obsData.RR ?? ""), String(obsData.sHour ?? ""));
            procData.RH = formatRH(String(obsData.RH ?? ""), true);
            procData.dBulb = obsData.dBulb == null ? "///" : formatTemp(String(obsData.dBulb), true);
            procData.dPoiint = obsData.dPoiint == null ? "///" : formatTemp(String(obsData.dPoiint), true);
            procData.stnP = obsData.stnP == null ? "///" : formatPressure(String(obsData.stnP));
            procData.mslP = obsData.mslP == null ? "///" : formatPressure(String(obsData.mslP));
            procData.net3hr = formatNet3hr(String(obsData.net3hr ?? ""));
            procData.weatherGroup = getWeatherGroup(
                String(procData.wpIndc ?? "2"),
                String(obsData.presW ?? ""),
                String(obsData.pastW1 ?? ""),
                String(obsData.pastW2 ?? "")
            );
            procData.cloudGroup = getCloudTypeCode(
                String(obsData.amtLC),
                String(obsData.typeFirstLayer),
                String(obsData.typeSecondLayer),
                String(obsData.typeThirdLayer),
                String(obsData.typeFourthLayer)
            );
            procData.cGroup = getCloudGroup(
                String(obsData.amtFirstLayer ?? ""),
                String(obsData.typeFirstLayer ?? ""),
                String(obsData.heightFirstLayer ?? ""),
                String(obsData.amtSecondLayer ?? ""),
                String(obsData.typeSecondLayer ?? ""),
                String(obsData.heightSecondLayer ?? ""),
                String(obsData.amtThirdLayer ?? ""),
                String(obsData.typeThirdLayer ?? ""),
                String(obsData.heightThirdLayer ?? ""),
                String(obsData.amtFourthLayer ?? ""),
                String(obsData.typeFourthLayer ?? ""),
                String(obsData.heightFourthLayer ?? "")
            );

            const noClouds =
                !obsData.amtFirstLayer &&
                !obsData.amtSecondLayer &&
                !obsData.amtThirdLayer &&
                !obsData.amtFourthLayer;

            procData.cGroup = noClouds ? "" : procData.cGroup;
            procData.cloudGroup = noClouds ? "" : procData.cloudGroup;
            procData.heightLL = noClouds ? "9" : procData.heightLL;
            procData.dirLow = getCodeDir(String(obsData.dirLow ?? ""));
            procData.dirMid = getCodeDir(String(obsData.dirMid ?? ""));
            procData.dirHigh = getCodeDir(String(obsData.dirHigh ?? ""));
            procData.pres24 = formatPres24(String(obsData.pres24 ?? ""));
            procData.remark =
                obsData.obsINT && String(obsData.obsINT).trim() !== "" && obsData.remark
                    ? `${obsData.remark};`
                    : obsData.remark ?? "";

            // 5️⃣ Convert date & hour formats
            if (procData.sDate) {
                const dateObj = new Date(String(procData.sDate));
                procData.sDate = dateObj.getUTCDate().toString().padStart(2, "0"); // 01..31
            }
            if (procData.sHour) {
                procData.sHour = String(procData.sHour).substring(0, 2).padStart(2, "0");
            }

        }

        if (category.cName === "METAR" || category.cName === "SPECI") {
            // 1️⃣ Fetch the latest aerodrome observation for this station, date, and hour
            const aeroData = await getLAerodromeData(
                db,
                stnID,
                category.cName,
                procData.sHour,
                procData.sDate,
                "sDate",
                "DESC"
            );
            const latest = aeroData?.[0] ?? {};

            // 1️⃣a Fetch station info to get ICAO
            const station = await db.getFirstAsync<{ ICAO: string }>(
                `SELECT ICAO FROM stations WHERE Id = ?`,
                [stnID]
            );
            const stationICAO = station?.ICAO ?? "";


            // 2️⃣ Copy into procData
            const cloudLayers = [
                latest.Cloud1,
                latest.Cloud2,
                latest.Cloud3,
                latest.Cloud4
            ].filter(Boolean);

            const isCAVOK =
                (latest.PresVV === "9999" || latest.PresVV === 9999) &&
                (!latest.PresWx || latest.PresWx.trim() === "") &&
                cloudLayers.length === 0;

            procData = {
                ...procData,
                MorS: category.cName,
                ICAO: stationICAO,
                sDate: latest.sDate
                    ? String(new Date(latest.sDate).getUTCDate()).padStart(2, "0")
                    : "",
                sHour: latest.sHour,
                SurfaceWind: latest.SurfaceWind ?? "",

                // ✅ KEY CHANGE
                PresVV: isCAVOK ? "CAVOK" : (latest.PresVV ?? "////"),
                PresWx: isCAVOK ? "" : (latest.PresWx ?? ""),
                Cloud: isCAVOK ? "" : cloudLayers.join(" "),

                TD: [
                    latest.Tem != null ? String(latest.Tem).padStart(2, "0") : "",
                    latest.Dew != null ? String(latest.Dew).padStart(2, "0") : ""
                ].join("/"),

                AltPres: latest.AltPres ? `Q${latest.AltPres}` : "Q////",
                Supplemental: latest.Supplemental ?? "",
                Remarks: `RMK ${latest.Remarks?.trim() || ""} A${Math.round(latest.AltPres * 2.953)}`,
                Signature: latest.Signature ?? "",
                ATS: latest.ATS ?? ""
            };

            // 3️⃣ Replace template placeholders dynamically
            for (const key of Object.keys(procData)) {
                const value = procData[key] != null ? String(procData[key]) : "";
                const placeholder = `:${key.toUpperCase()}:`; // assumes template placeholders match uppercase field names
                code = code.replace(new RegExp(placeholder, "g"), value);
            }
        }
        // 6️⃣ Replace template placeholders with processed values
        for (const param of codeParams) {
            const rawValue = procData[param.var];
            const value: string = rawValue != null ? String(rawValue) : "";
            code = code.replace(new RegExp(param.par, "g"), value);
        }

        // 7️⃣ Normalize whitespace
        code = code.replace(/[ \t]+/g, " ").trim();

        return code;
    } catch (error) {
        console.error("Error generating code:", error);
        return "";
    }
}
