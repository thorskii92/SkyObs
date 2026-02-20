import stationsJSON from "@/assets/seeds/stations.json";
import synopDataJSON from "@/assets/seeds/synop_data.json";
import * as SQLite from "expo-sqlite";

export const DB_NAME = "plotsdb"

let database: SQLite.SQLiteDatabase | null = null;

export async function getDB(): Promise<SQLite.SQLiteDatabase> {
    if (!database) {
        database = await SQLite.openDatabaseAsync(DB_NAME, { useNewConnection: true });
    }
    return database;
}

// For testing db connectivity
export const testTables = async (database: SQLite.SQLiteDatabase) => {
    const tables = await database.getAllAsync(
        `SELECT name FROM sqlite_master WHERE type='table';`
    );

    console.log("Tables:", tables);
};

// Generic Transaction Helper Function
export const withTransaction = async <T>(
    db: SQLite.SQLiteDatabase,
    operation: (tx: SQLite.SQLiteDatabase) => Promise<T>
): Promise<T> => {
    try {
        await db.execAsync("BEGIN");

        const result = await operation(db);

        await db.execAsync("COMMIT");

        return result;
    } catch (error) {
        await db.execAsync("ROLLBACK");
        console.error("Transaction failed. Rolled back.", error);
        throw error;
    }
}

// Prefixed with T for tables
export const createTStations = async (db: SQLite.SQLiteDatabase) => {
    try {
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS stations (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                wmoID TEXT NOT NULL,
                stationID TEXT NOT NULL UNIQUE,
                ICAO TEXT UNIQUE,
                stnName TEXT NOT NULL,
                Latitude REAL,
                Longitude REAL,
                height REAL,
                mslCor REAL,
                altCor REAL,
                Synoptic INTEGER,
                UpperAir INTEGER,
                Aeromet INTEGER,
                Agromet INTEGER,
                Hydromet INTEGER,
                Radar INTEGER,
                isRegionOffice INTEGER,
                PRSD TEXT,
                LatDef TEXT,
                LonDef TEXT,
                Station TEXT,
                Town TEXT,
                Province TEXT,
                ElevationFt TEXT
            );
        `);

        console.log("stations table created successfully.");
    } catch (error) {
        console.error("Error creating stations table:", error);
    }
};

export const createTSynopData = async (db: SQLite.SQLiteDatabase) => {
    try {
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS synop_data (
                sID INTEGER PRIMARY KEY AUTOINCREMENT,
                uID INTEGER,
                stnID INTEGER,
                sDate TEXT,
                sHour TEXT,
                sActualDateTime TEXT,
                heightLL INTEGER,
                VV REAL,
                SummTotal INTEGER,
                wDir INTEGER,
                wSpd INTEGER,
                dBulb REAL,
                wBulb REAL,
                dPoiint REAL,
                RH REAL,
                stnP REAL,
                mslP REAL,
                altP REAL,
                tendency INTEGER,
                net3hr REAL,
                vaporP REAL,
                RR REAL,
                tR INTEGER,
                presW INTEGER,
                pastW1 INTEGER,
                pastW2 INTEGER,
                amtLC INTEGER,
                amtFirstLayer INTEGER,
                typeFirstLayer INTEGER,
                heightFirstLayer INTEGER,
                amtSecondLayer INTEGER,
                typeSecondLayer INTEGER,
                heightSecondLayer INTEGER,
                amtThirdLayer INTEGER,
                typeThirdLayer INTEGER,
                heightThirdLayer INTEGER,
                amtFourthLayer INTEGER,
                typeFourthLayer INTEGER,
                heightFourthLayer INTEGER,
                ceiling INTEGER,
                stateOfSea TEXT,
                seaDir INTEGER,
                seaPer INTEGER,
                seaHeight INTEGER,
                maxTemp REAL,
                minTemp REAL,
                pres24 REAL,
                remark TEXT,
                obsINT TEXT,
                pAttachTherm REAL,
                pObsBaro REAL,
                pCorrection REAL,
                pBarograph REAL,
                pBaroCorrection REAL,
                summaryDate TEXT,
                dirLow TEXT,
                dirMid TEXT,
                dirHigh TEXT,

                UNIQUE(stnID, sDate, sHour),
                FOREIGN KEY (stnID) REFERENCES stations(Id)
            );
        `);

        // Optional but recommended: Enable foreign keys
        await db.execAsync(`PRAGMA foreign_keys = ON;`);
        await db.execAsync(`
            CREATE INDEX IF NOT EXISTS idx_synop_station_date
            ON synop_data (stnID, sDate);
        `);

        console.log("synop_data table created successfully.");
    } catch (error) {
        console.error("Error creating synop_data table:", error);
    }
};

export const createTPsychrometric = async (db: SQLite.SQLiteDatabase) => {
    try {
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS psychrometric (
                pID INTEGER PRIMARY KEY AUTOINCREMENT,
                dBulb REAL,
                wBulb REAL,
                dPoint REAL,
                RH REAL,
                vPressure REAL,

                UNIQUE(dBulb, wBulb)
            );
        `);

        await db.execAsync(`
            CREATE INDEX IF NOT EXISTS idx_psychro_db_wb
            ON psychrometric (dBulb, wBulb);
        `);

        console.log("psychrometric table created successfully.");
    } catch (error) {
        console.error("Error creating psychrometric table:", error);
    }
};

export const createTCodeTemplate = async (db: SQLite.SQLiteDatabase) => {
    try {
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS codetemplate (
                codeID INTEGER PRIMARY KEY AUTOINCREMENT,
                stnID INTEGER,
                category TEXT NOT NULL,        -- SYNOP / METAR / SPECI / AGRO
                hour TEXT NOT NULL,            -- 00-23 or "--"
                uID INTEGER,
                Template TEXT,
                dateadded TEXT DEFAULT (datetime('now')),
                dateupdated TEXT,

                UNIQUE(stnID, category, hour),
                FOREIGN KEY (stnID) REFERENCES stations(Id)
            );
        `);

        await db.execAsync(`
            CREATE INDEX IF NOT EXISTS idx_codetemplate_station
            ON codetemplate (stnID);
        `);

        await db.execAsync(`PRAGMA foreign_keys = ON;`);

        console.log("codetemplate table created successfully.");
    } catch (error) {
        console.error("Error creating codetemplate table:", error);
    }
};

export const createTCodeParameter = async (db: SQLite.SQLiteDatabase) => {
    try {
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS codeparameter (
                paraID INTEGER PRIMARY KEY AUTOINCREMENT,
                stnID INTEGER,
                uID INTEGER,
                category TEXT NOT NULL,
                varname TEXT NOT NULL,
                var TEXT NOT NULL,
                par TEXT NOT NULL,
                dateadded TEXT DEFAULT (datetime('now')),
                dateupdated TEXT,

                UNIQUE(stnID, category, var),
                FOREIGN KEY (stnID) REFERENCES stations(Id)
            );
        `);

        await db.execAsync(`
            CREATE INDEX IF NOT EXISTS idx_codeparameter_station
            ON codeparameter (stnID);
        `);

        await db.execAsync(`PRAGMA foreign_keys = ON;`);

        console.log("codeparameter table created successfully.");
    } catch (error) {
        console.error("Error creating codeparameter table:", error);
    }
};

export const createTSmsRecipients = async (db: SQLite.SQLiteDatabase) => {
    try {
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS sms_recipients (
                recipId INTEGER PRIMARY KEY AUTOINCREMENT,
                stnId INTEGER,
                uId INTEGER,
                num TEXT NOT NULL,
                name TEXT,
                category TEXT,
                date_added TEXT DEFAULT (datetime('now')),
                date_updated TEXT,

                FOREIGN KEY (stnId) REFERENCES stations(Id)
            );
        `);

        await db.execAsync(`PRAGMA foreign_keys = ON;`);
        console.log("sms_recipients table created successfully.");
    } catch (error) {
        console.error("Error creating sms_recipients table:", error);
    }
};


export const createTSmsLogs = async (db: SQLite.SQLiteDatabase) => {
    try {
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS sms_logs (
                smsId INTEGER PRIMARY KEY AUTOINCREMENT,
                stnId INTEGER,
                uId INTEGER,
                status TEXT NOT NULL,          -- e.g., "success", "failed", "pending"
                msg TEXT NOT NULL,
                recip TEXT NOT NULL,
                dateSent TEXT DEFAULT (datetime('now')),
                channel TEXT DEFAULT 'app',    -- e.g., "app", "Twilio", "GSM"

                UNIQUE(recip, dateSent),
                FOREIGN KEY (stnId) REFERENCES stations(Id)
            );
        `);

        await db.execAsync(`
            CREATE INDEX IF NOT EXISTS idx_sms_logs_station
            ON sms_logs (stnId);
        `);

        await db.execAsync(`PRAGMA foreign_keys = ON;`);

        console.log("sms_logs table created successfully.");
    } catch (error) {
        console.error("Error creating sms_logs table:", error);
    }
};


// Prefixed with L (stands for local)
// Stations
export const getLStations = async (db: SQLite.SQLiteDatabase) => {
    try {
        const stations = await db.getAllAsync(`
            SELECT * FROM stations
            ORDER BY stnName
        `);
        return stations;
    } catch (error) {
        console.error("Error fetching local stations:", error);
        return [];
    }
};

// Synoptic Data
export const getLSynopData = async (
    db: SQLite.SQLiteDatabase,
    stnID: string | number,
    sHour?: string,
    sDate?: string
) => {
    try {
        let query = `SELECT * FROM synop_data WHERE stnID = ?`;
        const params: (string | number)[] = [stnID];

        if (sHour) {
            query += ` AND sHour = ?`;
            params.push(sHour);
        }

        if (sDate) {
            query += ` AND sDate = ?`;
            params.push(sDate);
        }

        query += ` ORDER BY sDate DESC, sHour DESC`;

        const synopData = await db.getAllAsync(query, params);

        return synopData;
    } catch (error) {
        console.error("Error fetching local synoptic data:", error);
        return [];
    }
};

// Psychrometric
export const getLPsychrometric = async (db: SQLite.SQLiteDatabase, dBulb: number, wBulb: number) => {
    try {
        return await db.getFirstAsync(
            `SELECT * FROM psychrometric
             WHERE dBulb = ? AND wBulb = ?`,
            [dBulb, wBulb]
        );
    } catch (error) {
        console.error("Error fetching local psychrometric data:", error);
        return null;
    }
};

export const upsertLPsychrometric = async (db: SQLite.SQLiteDatabase, params: any) => {
    try {
        await db.runAsync(
            `INSERT INTO psychrometric (dBulb, wBulb, dPoint, RH, vPressure)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(dBulb, wBulb) DO UPDATE SET
                dPoint = excluded.dPoint,
                RH = excluded.RH,
                vPressure = excluded.vPressure
            `,
            [
                params.dBulb,
                params.wBulb,
                params.dPoint ?? null,
                params.RH ?? null,
                params.vPressure ?? null
            ]
        );
    } catch (error) {
        console.error("Error upserting local psychrometric data:", error);
    }
};


// Code Template
export type CodeTemplate = {
    Template: string;
};

export const getLCodeTemplate = async (db: SQLite.SQLiteDatabase, stnID: string, category: string, hour: string): Promise<CodeTemplate | null> => {
    try {
        const template = await db.getFirstAsync<CodeTemplate>(
            `SELECT Template FROM codetemplate
            WHERE stnID = ? AND category = ? AND hour = ?`,
            [stnID, category, hour]
        );

        if (!template) throw new Error("No code template found for this station/hour/category");

        return template
    } catch (error) {
        console.error("Error fetching local code template data:", error);
        return null
    }
}

// Code Parameters
export type CodeParameter = {
    par: string;
    var: string;
    varName: string;
};

export const getLCodeParams = async (db: SQLite.SQLiteDatabase, stnID: string, category: string): Promise<CodeParameter[] | null> => {
    try {
        const codeParameters = await db.getAllAsync<CodeParameter>(
            `SELECT par, var, varName FROM codeparameter
            WHERE stnID = ? AND category = ?`,
            [stnID, category]
        );

        if (!codeParameters) throw new Error("No code parameters found for this station/category.");

        return codeParameters
    } catch (error) {
        console.error("Error fetching local code parameter:", error);
        return null
    }
}

// SEEDERS
export const seedTStationsIfEmpty = async (
    db: SQLite.SQLiteDatabase
) => {
    try {
        const result = await db.getFirstAsync<{ count: number }>(
            `SELECT COUNT(*) as count FROM stations`
        );

        if (result && result.count > 0) {
            console.log("Stations already seeded.");
            return;
        }

        console.log("Seeding stations table...");

        await withTransaction(db, async (tx) => {
            for (const station of stationsJSON) {
                await tx.runAsync(
                    `
          INSERT INTO stations (
            wmoID, stationID, ICAO, stnName,
            Latitude, Longitude, height, mslCor, altCor,
            Synoptic, UpperAir, Aeromet, Agromet,
            Hydromet, Radar, isRegionOffice,
            PRSD, LatDef, LonDef,
            Station, Town, Province, ElevationFt
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
                    [
                        station.wmoID,
                        station.stationID,
                        station.ICAO ?? null,
                        station.stnName,
                        station.Latitude ?? null,
                        station.Longitude ?? null,
                        station.height ?? null,
                        station.mslCor ?? null,
                        station.altCor ?? null,
                        station.Synoptic ?? null,
                        station.UpperAir ?? null,
                        station.Aeromet ?? null,
                        station.Agromet ?? null,
                        station.Hydromet ?? null,
                        station.Radar ?? null,
                        station.isRegionOffice ?? null,
                        station.PRSD ?? null,
                        station.LatDef ?? null,
                        station.LonDef ?? null,
                        station.Station ?? null,
                        station.Town ?? null,
                        station.Province ?? null,
                        station.ElevationFt ?? null,
                    ]
                );
            }
        });

        console.log("Stations seeded successfully.");
    } catch (error) {
        console.error("Error seeding stations:", error);
    }
};

export const seedTSynopDataIfEmpty = async (
    db: SQLite.SQLiteDatabase
) => {
    try {
        const result = await db.getFirstAsync<{ count: number }>(
            `SELECT COUNT(*) as count FROM synop_data`
        );

        if (result && result.count > 0) {
            console.log("Synoptic data already seeded.");
            return;
        }

        console.log("Seeding synop_data table...");

        await withTransaction(db, async (tx) => {
            for (const obs of synopDataJSON) {
                await tx.runAsync(
                    `
          INSERT INTO synop_data (
            sID, uID, stnID, sDate, sHour, sActualDateTime,
            heightLL, VV, SummTotal, wDir, wSpd,
            dBulb, wBulb, dPoiint, RH,
            stnP, mslP, altP, tendency, net3hr,
            vaporP, RR, tR, presW, pastW1, pastW2,
            amtLC,
            amtFirstLayer, typeFirstLayer, heightFirstLayer,
            amtSecondLayer, typeSecondLayer, heightSecondLayer,
            amtThirdLayer, typeThirdLayer, heightThirdLayer,
            amtFourthLayer, typeFourthLayer, heightFourthLayer,
            ceiling,
            stateOfSea, seaDir, seaPer, seaHeight,
            maxTemp, minTemp, pres24,
            remark, obsINT,
            pAttachTherm, pObsBaro, pCorrection,
            pBarograph, pBaroCorrection,
            summaryDate,
            dirLow, dirMid, dirHigh
          )
          VALUES (
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?,
            ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?,
            ?,
            ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?,
            ?, ?, ?,
            ?, ?,
            ?,
            ?, ?, ?
          )
          `,
                    [
                        obs.sID,
                        obs.uID,
                        obs.stnID,
                        obs.sDate,
                        obs.sHour,
                        obs.sActualDateTime || null,

                        obs.heightLL ?? null,
                        obs.VV ?? null,
                        obs.SummTotal ?? null,
                        obs.wDir ?? null,
                        obs.wSpd ?? null,

                        obs.dBulb ?? null,
                        obs.wBulb ?? null,
                        obs.dPoiint ?? null,
                        obs.RH ?? null,

                        obs.stnP ?? null,
                        obs.mslP ?? null,
                        obs.altP ?? null,
                        obs.tendency ?? null,
                        obs.net3hr ?? null,

                        obs.vaporP ?? null,
                        obs.RR ?? null,
                        obs.tR ?? null,
                        obs.presW ?? null,
                        obs.pastW1 ?? null,
                        obs.pastW2 ?? null,

                        obs.amtLC ?? null,

                        obs.amtFirstLayer ?? null,
                        obs.typeFirstLayer ?? null,
                        obs.heightFirstLayer ?? null,

                        obs.amtSecondLayer ?? null,
                        obs.typeSecondLayer ?? null,
                        obs.heightSecondLayer ?? null,

                        obs.amtThirdLayer ?? null,
                        obs.typeThirdLayer ?? null,
                        obs.heightThirdLayer ?? null,

                        obs.amtFourthLayer ?? null,
                        obs.typeFourthLayer ?? null,
                        obs.heightFourthLayer ?? null,

                        obs.ceiling ?? null,

                        obs.stateOfSea || null,
                        obs.seaDir ?? null,
                        obs.seaPer ?? null,
                        obs.seaHeight ?? null,

                        obs.maxTemp ?? null,
                        obs.minTemp ?? null,
                        obs.pres24 ?? null,

                        obs.remark || null,
                        obs.obsINT || null,

                        obs.pAttachTherm ?? null,
                        obs.pObsBaro ?? null,
                        obs.pCorrection ?? null,

                        obs.pBarograph ?? null,
                        obs.pBaroCorrection ?? null,

                        obs.summaryDate || null,

                        obs.dirLow || null,
                        obs.dirMid || null,
                        obs.dirHigh || null,
                    ]
                );
            }
        });

        console.log("Synoptic data seeded successfully.")
    } catch (error) {
        console.error("Error seeding synoptic data:", error);
    }
}