import * as SQLite from "expo-sqlite";
import { Station } from "../models/station";
import { API_URL, getStations, getSynopData } from "./api";

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
    try {
        // Get all table names
        const tables: { name: string }[] = await database.getAllAsync(
            `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';`
        );

        console.log("Tables found:", tables.map(t => t.name));

        for (const table of tables) {
            const tableName = table.name;
            console.log(`\n=== Table: ${tableName} ===`);

            // Get columns
            const columns: { name: string }[] = await database.getAllAsync(
                `PRAGMA table_info(${tableName});`
            );

            const columnNames = columns.map(col => col.name);
            console.log("Columns:", columnNames.join(", "));

            // Get 1 record for reference
            const record: any[] = await database.getAllAsync(
                `SELECT * FROM ${tableName} LIMIT 1;`
            );

            if (record.length > 0) {
                console.log("Sample record:", record[0]);
            } else {
                console.log("No records found in this table.");
            }
        }
    } catch (error) {
        console.error("Error testing tables:", error);
    }
};

/**
 * Clears all tables in the SQLite database.
 * Use for debugging only!
 */
export const clearDatabase = async (db: SQLite.SQLiteDatabase) => {
    try {
        await withTransaction(db, async (tx) => {
            // Get all table names except internal SQLite tables
            const tablesResult = await tx.getAllAsync<{ name: string }>(
                `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';`
            );

            const tables = tablesResult.map((row) => row.name);

            // Drop each table
            for (const table of tables) {
                await tx.execAsync(`DROP TABLE IF EXISTS ${table};`);
                console.log(`Dropped table: ${table}`);
            }
        });

        console.log("Database cleared successfully!");
    } catch (error) {
        console.error("Error clearing database:", error);
    }
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
                isValidated INTEGER DEFAULT 0,

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

        // Trigger to prevent updates on validated records
        await db.execAsync(`
            CREATE TRIGGER IF NOT EXISTS trg_prevent_update_validated
            BEFORE UPDATE ON synop_data
            FOR EACH ROW
            WHEN OLD.isValidated = 1
            BEGIN
                SELECT RAISE(ABORT, 'Cannot update a validated record');
            END;
        `);

        // Trigger to prevent inserting a new record as validated
        await db.execAsync(`
            CREATE TRIGGER IF NOT EXISTS trg_prevent_insert_validated
            BEFORE INSERT ON synop_data
            FOR EACH ROW
            WHEN NEW.isValidated = 1
            BEGIN
                SELECT RAISE(ABORT, 'Cannot insert a record as validated');
            END;
        `);

        console.log("synop_data table created successfully.");
    } catch (error) {
        console.error("Error creating synop_data table:", error);
    }
};

// Prefixed with T for tables
export const createTPsychrometric = async (
    db: SQLite.SQLiteDatabase
) => {
    try {
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS psychrometric (
                pID INTEGER PRIMARY KEY AUTOINCREMENT,
                dBulb REAL DEFAULT NULL,
                wBulb REAL DEFAULT NULL,
                dPoint REAL DEFAULT NULL,
                RH REAL DEFAULT NULL,
                vPressure REAL DEFAULT NULL
            );
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
                cID INTEGER,
                hour TEXT, -- if specific
                uID INTEGER,
                Template TEXT,
                tType TEXT, -- General | Specific
                dateadded TEXT DEFAULT (datetime('now')),
                dateupdated TEXT,

                UNIQUE(stnID, cID, hour, tType)

                FOREIGN KEY (stnID) REFERENCES stations(Id),
                FOREIGN KEY (cID) REFERENCES category(cID)
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
                cID INTEGER,
                varname TEXT NOT NULL,
                var TEXT NOT NULL,
                par TEXT NOT NULL,
                dateadded TEXT DEFAULT (datetime('now')),
                dateupdated TEXT,

                UNIQUE(stnID, cID, var, par),

                FOREIGN KEY (stnID) REFERENCES stations(Id),
                FOREIGN KEY (cID) REFERENCES category(cID)
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
                cID INTEGER,
                num TEXT NOT NULL,
                name TEXT,
                date_added TEXT DEFAULT (datetime('now')),
                date_updated TEXT,

                FOREIGN KEY (stnId) REFERENCES stations(Id),
                FOREIGN KEY (cID) REFERENCES category(cID),

                UNIQUE (num, name, cID)  -- ensures each recipient + name + category is unique
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

                category TEXT NOT NULL,
                status TEXT NOT NULL,
                msg TEXT NOT NULL,

                recip_num TEXT NOT NULL,
                recip_name TEXT,

                obsDate TEXT NOT NULL,                 -- YYYY-MM-DD
                obsHour TEXT NOT NULL,                 -- ✅ "HH00" format (e.g., "1300")

                dateSent TEXT DEFAULT (datetime('now')),

                channel TEXT DEFAULT 'skyobs',

                UNIQUE(recip_num, obsDate, obsHour, category),

                FOREIGN KEY (stnId) REFERENCES stations(Id)
            );
        `);

        await db.execAsync(`
            CREATE INDEX IF NOT EXISTS idx_sms_logs_station
            ON sms_logs (stnId);
        `);

        await db.execAsync(`
            CREATE INDEX IF NOT EXISTS idx_sms_logs_category
            ON sms_logs (category);
        `);

        await db.execAsync(`PRAGMA foreign_keys = ON;`);

        console.log("sms_logs table created successfully.");
    } catch (error) {
        console.error("Error creating sms_logs table:", error);
    }
};

export const createTCategory = async (db: SQLite.SQLiteDatabase) => {
    try {
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS category (
                cID INTEGER PRIMARY KEY AUTOINCREMENT,
                stnID INTEGER,
                cName TEXT NOT NULL,
                date_created TEXT DEFAULT (datetime('now')),
                date_updated TEXT,

                UNIQUE(stnID, cName),
                FOREIGN KEY (stnID) REFERENCES stations(Id)
            );
        `);

        await db.execAsync(`
            CREATE INDEX IF NOT EXISTS idx_category_station
            ON category (stnID);
        `);

        await db.execAsync(`PRAGMA foreign_keys = ON;`);

        console.log("category table created successfully.");
    } catch (error) {
        console.error("Error creating category table:", error);
    }
};

export const createTAerodrome = async (db: SQLite.SQLiteDatabase) => {
    try {
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS aerodrome (
                metID INTEGER PRIMARY KEY AUTOINCREMENT,

                stnID INTEGER NOT NULL,
                uID INTEGER,

                MorS TEXT NOT NULL,  -- changed from INTEGER to TEXT

                sDate TEXT NOT NULL,
                sHour TEXT NOT NULL,

                SurfaceWind TEXT,
                PresVV TEXT,
                PresWx TEXT,

                Cloud1 TEXT,
                Cloud2 TEXT,
                Cloud3 TEXT,
                Cloud4 TEXT,

                Tem INTEGER,
                Dew INTEGER,

                AltPres REAL,
                Supplemental TEXT,
                Remarks TEXT,

                Signature TEXT,
                ATS TEXT,

                date_created TEXT DEFAULT (datetime('now')),
                date_updated TEXT,

                UNIQUE(stnID, MorS, sDate, sHour),

                FOREIGN KEY (stnID) REFERENCES stations(Id),
                FOREIGN KEY (uID) REFERENCES users(Id)
                -- Removed MorS foreign key reference since it's now TEXT
            );
        `);

        await db.execAsync(`
            CREATE INDEX IF NOT EXISTS idx_aerodrome_station
            ON aerodrome (stnID);
        `);

        await db.execAsync(`
            CREATE INDEX IF NOT EXISTS idx_aerodrome_datetime
            ON aerodrome (sDate, sHour);
        `);

        await db.execAsync(`PRAGMA foreign_keys = ON;`);

        console.log("aerodrome table created successfully.");
    } catch (error) {
        console.error("Error creating aerodrome table:", error);
    }
};

// Prefixed with L (stands for local)
// Stations
export const getLStations = async (
    db: SQLite.SQLiteDatabase,
    stnID?: number | string
): Promise<Station[]> => {
    try {
        let query = `SELECT * FROM stations`;
        const params: (number | string)[] = [];

        if (stnID !== undefined) {
            query += ` WHERE Id = ?`;
            params.push(stnID);
        }

        query += ` ORDER BY stnName`;

        const stations = await db.getAllAsync<Station>(query, params);
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
    sDate?: string,
    sortBy: string = "sHour",       // default sort column
    sortOrder: "ASC" | "DESC" = "DESC" // default sort order
) => {
    try {
        let query = `SELECT * FROM synop_data WHERE stnID = ?`;
        const params: (string | number)[] = [stnID];

        if (sHour) {
            query += ` AND sHour = ?`;
            params.push(sHour);
        }

        if (sDate) {
            query += ` AND sDate LIKE ? || '%'`;
            params.push(sDate);
        }

        // Validate column name to prevent SQL injection
        const allowedColumns = ["sDate", "sHour", "dBulb", "wBulb", "RH", "mslP"];
        if (!allowedColumns.includes(sortBy)) sortBy = "sDate";

        query += ` ORDER BY ${sortBy} ${sortOrder}`;

        console.log(query)
        const synopData = await db.getAllAsync(query, params);
        return synopData;
    } catch (error) {
        console.error("Error fetching local synoptic data:", error);
        return [];
    }
};

export const upsertSynopData = async (
    db: SQLite.WebSQLDatabase | SQLite.SQLiteDatabase,
    data: Record<string, any>
) => {
    try {
        const { stnID, sDate, sHour } = data;

        if (!stnID || !sDate || !sHour) {
            console.error("Missing required keys: stnID, sDate, sHour", data);
            return;
        }

        const sql = `
            INSERT INTO synop_data (
                uID, stnID, sDate, sHour, sActualDateTime,
                heightLL, VV, SummTotal, wDir, wSpd,
                dBulb, wBulb, dPoiint, RH, stnP, mslP, altP,
                tendency, net3hr, vaporP, RR, tR, presW,
                pastW1, pastW2, amtLC,
                amtFirstLayer, typeFirstLayer, heightFirstLayer,
                amtSecondLayer, typeSecondLayer, heightSecondLayer,
                amtThirdLayer, typeThirdLayer, heightThirdLayer,
                amtFourthLayer, typeFourthLayer, heightFourthLayer,
                ceiling, stateOfSea, seaDir, seaPer, seaHeight,
                maxTemp, minTemp, pres24, remark, obsINT,
                pAttachTherm, pObsBaro, pCorrection, pBarograph, pBaroCorrection,
                summaryDate, dirLow, dirMid, dirHigh, isValidated
            )
            VALUES (${Array(58).fill("?").join(", ")})
            ON CONFLICT(stnID, sDate, sHour)
            DO UPDATE SET
                VV = excluded.VV,
                wDir = excluded.wDir,
                wSpd = excluded.wSpd,
                dBulb = excluded.dBulb,
                wBulb = excluded.wBulb,
                dPoiint = excluded.dPoiint,
                RH = excluded.RH,
                stnP = excluded.stnP,
                mslP = excluded.mslP,
                altP = excluded.altP,
                tendency = excluded.tendency,
                net3hr = excluded.net3hr,
                vaporP = excluded.vaporP,
                RR = excluded.RR,
                pres24 = excluded.pres24,
                remark = excluded.remark;
        `;

        const values = [
            data.uID,
            data.stnID,
            data.sDate,
            data.sHour,
            data.sActualDateTime,

            data.heightLL,
            data.VV,
            data.SummTotal,
            data.wDir,
            data.wSpd,

            data.dBulb,
            data.wBulb,
            data.dPoiint,
            data.RH,
            data.stnP,
            data.mslP,
            data.altP,

            data.tendency,
            data.net3hr,
            data.vaporP,
            data.RR,
            data.tR,
            data.presW,

            data.pastW1,
            data.pastW2,
            data.amtLC,

            data.amtFirstLayer,
            data.typeFirstLayer,
            data.heightFirstLayer,

            data.amtSecondLayer,
            data.typeSecondLayer,
            data.heightSecondLayer,

            data.amtThirdLayer,
            data.typeThirdLayer,
            data.heightThirdLayer,

            data.amtFourthLayer,
            data.typeFourthLayer,
            data.heightFourthLayer,

            data.ceiling,
            data.stateOfSea,
            data.seaDir,
            data.seaPer,
            data.seaHeight,

            data.maxTemp,
            data.minTemp,
            data.pres24,
            data.remark,
            data.obsINT,

            data.pAttachTherm,
            data.pObsBaro,
            data.pCorrection,
            data.pBarograph,
            data.pBaroCorrection,

            data.summaryDate,
            data.dirLow,
            data.dirMid,
            data.dirHigh,

            0 // isValidated default
        ];

        await db.runAsync(sql, values);

        console.log(`Upserted synop_data for station ${stnID} on ${sDate} at ${sHour}`);

    } catch (err) {
        console.error("Error upserting synop_data:", err);
        console.error("DATA:", data);
    }
};

// Observed Data (joining stations with synop_data and aerodrome + category ID)
export const getLObservedData = async (
    db: SQLite.SQLiteDatabase,
    stnID: string | number,
    sHour?: string,
    sDate?: string,
    sortBy: string = "sHour",
    sortOrder: "ASC" | "DESC" = "DESC"
) => {
    try {
        return await withTransaction(db, async (tx) => {
            const conditions: string[] = ["sd.stnID = ?"];
            const params: (string | number)[] = [stnID];

            if (sHour) {
                conditions.push("sd.sHour = ?");
                params.push(sHour);
            }
            if (sDate) {
                conditions.push("sd.sDate LIKE ? || '%'");
                params.push(sDate);
            }

            const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

            // Fetch SYNOP data with category ID
            const synopQuery = `
                SELECT sd.*, c.cID, 'SYNOP' AS category,
                       s.ICAO, s.wmoID, s.stationID, s.stnName, s.mslCor, s.altCor
                FROM synop_data sd
                LEFT JOIN stations s ON sd.stnID = s.Id
                LEFT JOIN category c ON c.stnID = sd.stnID AND c.cName = 'SYNOP'
                ${whereClause}
            `;
            const synopRows = await tx.getAllAsync(synopQuery, params);

            // Fetch Aerodrome data (METAR/SPECI) with category ID
            const aeroConditions: string[] = ["a.stnID = ?"];
            const aeroParams: (string | number)[] = [stnID];

            if (sHour) {
                aeroConditions.push("a.sHour = ?");
                aeroParams.push(sHour);
            }
            if (sDate) {
                aeroConditions.push("a.sDate LIKE ? || '%'");
                aeroParams.push(sDate);
            }

            const aeroWhere = aeroConditions.length ? `WHERE ${aeroConditions.join(" AND ")}` : "";

            const aeroQuery = `
                SELECT a.*, c.cID, a.MorS AS category,
                       s.ICAO, s.wmoID, s.stationID, s.stnName, s.mslCor, s.altCor
                FROM aerodrome a
                LEFT JOIN stations s ON a.stnID = s.Id
                LEFT JOIN category c ON c.stnID = a.stnID AND c.cName = a.MorS
                ${aeroWhere}
                AND a.MorS IN ('METAR', 'SPECI')
            `;
            const aeroRows = await tx.getAllAsync(aeroQuery, aeroParams);

            // Merge rows by sDate + sHour
            const merged: Record<string, any> = {};

            const addRow = (row: any) => {
                const key = `${row.sDate}_${row.sHour}`;
                if (!merged[key]) {
                    merged[key] = { ...row, category: row.category, cID: row.cID };
                } else {
                    // Merge fields: keep existing, overwrite null/empty, combine categories
                    Object.keys(row).forEach((k) => {
                        if (row[k] !== null && row[k] !== "" && (merged[key][k] === null || merged[key][k] === "")) {
                            merged[key][k] = row[k];
                        }
                    });
                    // Merge category and cID
                    const categories = new Set(merged[key].category.split(","));
                    categories.add(row.category);
                    merged[key].category = Array.from(categories).join(",");

                    const cIDs = new Set([merged[key].cID, row.cID].filter(Boolean));
                    merged[key].cID = Array.from(cIDs).join(",");
                }
            };

            synopRows.forEach(addRow);
            aeroRows.forEach(addRow);

            // Convert merged object to array and sort
            const result = Object.values(merged).sort((a, b) => {
                if (sortOrder === "ASC") return a[sortBy] > b[sortBy] ? 1 : -1;
                return a[sortBy] < b[sortBy] ? 1 : -1;
            });

            return result;
        });
    } catch (error) {
        console.error("Error fetching observed data:", error);
        return [];
    }
};

// Aerodrome Data
export const getLAerodromeData = async (
    db: SQLite.SQLiteDatabase,
    stnID: string | number,
    MorS?: string,                 // optional: "METAR" / "SPECI"
    sHour?: string,
    sDate?: string,
    sortBy: string = "sHour",       // default sort column
    sortOrder: "ASC" | "DESC" = "DESC" // default sort order
) => {
    try {
        let query = `SELECT * FROM aerodrome WHERE stnID = ?`;
        const params: (string | number)[] = [stnID];

        if (MorS !== undefined) {
            query += ` AND MorS = ?`;
            params.push(MorS);
        }

        if (sHour) {
            query += ` AND sHour = ?`;
            params.push(sHour);
        }

        if (sDate) {
            query += ` AND sDate = ?`;
            params.push(sDate);
        }

        // Validate column name to prevent SQL injection
        const allowedColumns = [
            "sDate",
            "sHour",
            "SurfaceWind",
            "PresVV",
            "PresWx",
            "Cloud1",
            "Cloud2",
            "Cloud3",
            "Cloud4",
            "Tem",
            "Dew",
            "AltPres",
            "Signature",
            "ATS",
            "date_created",
        ];
        if (!allowedColumns.includes(sortBy)) sortBy = "sDate";

        query += ` ORDER BY ${sortBy} ${sortOrder}`;

        console.log(query);

        const aerodromeData = await db.getAllAsync(query, params);
        return aerodromeData;
    } catch (error) {
        console.error("Error fetching local aerodrome data:", error);
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

export const getLCodeTemplate = async (
    db: SQLite.SQLiteDatabase,
    stnID: string,
    cID: number,
    hour?: string
): Promise<CodeTemplate | null> => {
    try {
        console.log("Fetching template for:", { stnID, cID, hour });

        let template: CodeTemplate | null = null;

        // 1️⃣ Specific template (requires hour)
        if (hour) {
            template = await db.getFirstAsync<CodeTemplate>(
                `SELECT Template, tType FROM codetemplate
                 WHERE stnID = ? AND cID = ? AND tType = 'Specific' AND hour = ?
                 LIMIT 1`,
                [stnID, cID, hour]
            );
        }

        // 2️⃣ General template (ignore hour)
        if (!template) {
            template = await db.getFirstAsync<CodeTemplate>(
                `SELECT Template, tType FROM codetemplate
                 WHERE stnID = ? AND cID = ? AND tType = 'General'
                 LIMIT 1`,
                [stnID, cID]
            );
        }

        if (!template) {
            console.warn("No code template found for this station/category/hour");
            return null;
        }

        return template;
    } catch (error) {
        console.error("Error fetching local code template data:", error);
        return null;
    }
};

// Code Parameters
export type CodeParameter = {
    par: string;
    var: string;
    varName: string;
};

export const getLCodeParams = async (db: SQLite.SQLiteDatabase, stnID: string, cID: number): Promise<CodeParameter[] | null> => {
    try {
        const codeParameters = await db.getAllAsync<CodeParameter>(
            `SELECT par, var, varName FROM codeparameter
            WHERE stnID = ? AND cID = ?`,
            [stnID, cID]
        );

        if (!codeParameters) throw new Error("No code parameters found for this station/cID.");

        return codeParameters
    } catch (error) {
        console.error("Error fetching local code parameter:", error);
        return null
    }
}

export const getLCategories = async (db: SQLite.SQLiteDatabase) => {
    try {
        const result = await db.getAllAsync(`
            SELECT cID, cName
            FROM category
            ORDER BY cID
        `);

        return result;
    } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
    }
};

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

        console.log("Fetching stations from API...");

        const stations = await getStations();

        if (!stations || stations.length === 0) {
            console.warn("No stations fetched from API.");
            return;
        }

        console.log(`Seeding ${stations.length} stations...`);

        await withTransaction(db, async (tx) => {
            for (const station of stations) {
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

        console.log("Stations seeded successfully from API.");
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

        console.log("Fetching synop data from API (last 1 month)...");

        // 👉 Compute last 1 month range dynamically
        const now = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(now.getMonth() - 1);

        // Format as YYYY-MM-DD
        const startDate = oneMonthAgo.toISOString().split('T')[0];
        const endDate = now.toISOString().split('T')[0];

        // Fetch all pages
        let synopData: any[] = [];
        let page = 1;
        let totalPages = 1;

        do {
            const { results, pagination } = await getSynopData({
                startDate,
                endDate,
                page,
                limit: 500,
                sortBy: 'sDate',
                sortOrder: 'desc'
            });

            synopData = [...synopData, ...results];
            totalPages = pagination?.totalPages || 1;
            page++;
        } while (page <= totalPages);

        if (synopData.length === 0) {
            console.warn("No synop data fetched for the last month.");
            return;
        }

        console.log(`Seeding ${synopData.length} synop records...`);

        await withTransaction(db, async (tx) => {
            for (const obs of synopData) {
                await tx.runAsync(
                    `
                    INSERT OR REPLACE INTO synop_data (
                        uID, stnID, sDate, sHour, sActualDateTime,
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
                    VALUES (${Array(57).fill("?").join(",")})
                    `,
                    [
                        obs.uID,
                        obs.stnID,
                        obs.sDate,
                        obs.sHour,
                        obs.sActualDateTime ?? null,
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
                        obs.stateOfSea ?? null,
                        obs.seaDir ?? null,
                        obs.seaPer ?? null,
                        obs.seaHeight ?? null,
                        obs.maxTemp ?? null,
                        obs.minTemp ?? null,
                        obs.pres24 ?? null,
                        obs.remark ?? null,
                        obs.obsINT ?? null,
                        obs.pAttachTherm ?? null,
                        obs.pObsBaro ?? null,
                        obs.pCorrection ?? null,
                        obs.pBarograph ?? null,
                        obs.pBaroCorrection ?? null,
                        obs.summaryDate ?? null,
                        obs.dirLow ?? null,
                        obs.dirMid ?? null,
                        obs.dirHigh ?? null,
                    ]
                );
            }
        });

        console.log("Synop data seeded successfully.");

    } catch (error) {
        console.error("Error seeding synop data:", error);
    }
};

export const seedTCodeTemplatesIfEmpty = async (db: SQLite.SQLiteDatabase) => {
    try {
        const existing = await db.getFirstAsync<{ count: number }>(`
            SELECT COUNT(*) as count FROM codetemplate
        `);

        if (existing && existing.count > 0) {
            console.log("Codetemplate already seeded.");
            return;
        }

        console.log("Fetching codetemplates from API...");

        const res = await fetch(`${API_URL}/api/codetemplate`);
        const data = await res.json();
        const templates = data.results || data;

        await withTransaction(db, async (tx) => {
            for (const t of templates) {
                await tx.runAsync(
                    `INSERT OR IGNORE INTO codetemplate
                    (codeID, stnID, cID, hour, uID, Template, tType)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        t.codeID,
                        t.stnID,
                        t.cID,
                        t.hour,
                        t.uID || null,
                        t.Template,
                        t.tType
                    ]
                );
            }
        });

        console.log("Codetemplates seeded locally.");
    } catch (error) {
        console.error("Error seeding codetemplates:", error);
    }
};


export const seedTCodeParametersIfEmpty = async (db: SQLite.SQLiteDatabase) => {
    try {
        const existing = await db.getFirstAsync<{ count: number }>(`
            SELECT COUNT(*) as count FROM codeparameter
        `);

        if (existing && existing.count > 0) {
            console.log("Codeparameter already seeded.");
            return;
        }

        console.log("Fetching codeparameters from API...");

        const res = await fetch(`${API_URL}/api/codeparameter`);
        const data = await res.json();
        const params = data.results || data;

        await withTransaction(db, async (tx) => {
            for (const p of params) {
                await tx.runAsync(
                    `INSERT OR IGNORE INTO codeparameter 
                    (paraID, stnID, uID, cID, varname, var, par)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        p.paraID,
                        p.stnID,
                        p.uID || null,
                        p.cID,
                        p.varname,
                        p.var,
                        p.par
                    ]
                );
            }
        });

        console.log("Codeparameters seeded locally from API.");
    } catch (error) {
        console.error("Error seeding codeparameters:", error);
    }
};

export const seedTCategories = async (db: SQLite.SQLiteDatabase) => {
    try {
        const result = await db.getFirstAsync<{ count: number }>(`
            SELECT COUNT(*) as count FROM category
        `);

        if (result && result.count > 0) {
            console.log("Category table already seeded.");
            return;
        }

        console.log("Fetching categories from API...");

        const res = await fetch(`${API_URL}/api/category`);
        const data = await res.json();
        const categories = data.data || data;

        await withTransaction(db, async (tx) => {
            for (const c of categories) {
                await tx.runAsync(
                    `INSERT OR IGNORE INTO category (cID, stnID, cName)
                     VALUES (?, ?, ?)`,
                    [c.cID, c.stnID || 1, c.cName]
                );
            }
        });

        console.log("Categories seeded locally from API.");
    } catch (error) {
        console.error("Error seeding categories:", error);
    }
};

export const computeObservedPeriod = async (
    db: SQLite.SQLiteDatabase,
    stnID: number | string,
    sDate: string,
    sHour: string
): Promise<string | null> => {

    let hoursToCheck: number;
    let resultCode: string;

    if (sHour === "0000") {
        hoursToCheck = 24;
        resultCode = "4";
    } else if (["0600", "1200", "1800"].includes(sHour)) {
        hoursToCheck = 6;
        resultCode = "1";
    } else if (["0300", "0900", "1500", "2100"].includes(sHour)) {
        hoursToCheck = 3;
        resultCode = "7";
    } else {
        return null; // ✅ FIXED
    }

    const rows = await db.getAllAsync(
        `SELECT RR, sHour 
         FROM synop_data
         WHERE stnID = ? AND sDate = ?`,
        [stnID, sDate]
    );

    const currentHour = Number(sHour.slice(0, 2));

    const hasRain = rows.some((r: any) => {
        if (!r.RR) return false;

        const rowHour = Number(r.sHour.slice(0, 2));
        const diff = currentHour - rowHour;

        return diff >= 0 && diff <= hoursToCheck;
    });

    return hasRain ? resultCode : "0";
};

// SMS Recipients
export const getLSmsRecipients = async (
    db: SQLite.SQLiteDatabase,
    filters?: {
        recipId?: number | string;
        cID?: number | string;
        stnId?: number | string;
    }
): Promise<any[]> => {
    try {
        let query = `
            SELECT 
                sr.*,
                c.cName AS categoryName
            FROM sms_recipients sr
            LEFT JOIN category c ON sr.cID = c.cID
            WHERE 1=1
        `;

        const params: (number | string)[] = [];

        if (filters?.recipId !== undefined) {
            query += ` AND sr.recipId = ?`;
            params.push(filters.recipId);
        }

        if (filters?.cID !== undefined) {
            query += ` AND sr.cID = ?`;
            params.push(filters.cID);
        }

        if (filters?.stnId !== undefined) {
            query += ` AND sr.stnId = ?`;
            params.push(filters.stnId);
        }

        query += ` ORDER BY sr.name`;

        const recipients = await db.getAllAsync(query, params);
        return recipients;
    } catch (error) {
        console.error("Error fetching sms recipients with filters:", error);
        return [];
    }
};

// SMS Logs
export const getLSmsLogs = async (
    db: SQLite.SQLiteDatabase,
    filters?: {
        stnId?: number | string;
        status?: string;
        recip?: string;
        dateFrom?: string;
        dateTo?: string;
        obsHour?: string;          // ✅ NEW ("0000"–"2300")
        limit?: number;
        offset?: number;
    },
    sortBy: string = "obsDate",    // ✅ default now observation-based
    sortOrder: "ASC" | "DESC" = "DESC"
): Promise<{ data: any[], total: number }> => {
    try {
        let countQuery = `
            SELECT COUNT(*) as total
            FROM sms_logs
            LEFT JOIN stations ON sms_logs.stnId = stations.Id
            WHERE 1=1
        `;

        let dataQuery = `
            SELECT
                smsId,
                sms_logs.stnId,
                uId,
                category,
                status,
                msg,
                recip_num,
                recip_name,
                obsDate,              -- ✅ NEW
                obsHour,              -- ✅ NEW
                dateSent,
                channel,
                stations.stnName,
                stations.ICAO
            FROM sms_logs
            LEFT JOIN stations ON sms_logs.stnId = stations.Id
            WHERE 1=1
        `;

        const params: any[] = [];

        if (filters?.stnId) {
            countQuery += " AND sms_logs.stnId = ?";
            dataQuery += " AND sms_logs.stnId = ?";
            params.push(filters.stnId);
        }

        if (filters?.status) {
            countQuery += " AND status = ?";
            dataQuery += " AND status = ?";
            params.push(filters.status);
        }

        // search both name + number
        if (filters?.recip) {
            countQuery += " AND (recip_num LIKE ? OR recip_name LIKE ?)";
            dataQuery += " AND (recip_num LIKE ? OR recip_name LIKE ?)";
            params.push(`%${filters.recip}%`, `%${filters.recip}%`);
        }

        // ✅ UPDATED: use obsDate directly (no date() wrapper)
        if (filters?.dateFrom) {
            countQuery += " AND obsDate >= ?";
            dataQuery += " AND obsDate >= ?";
            params.push(filters.dateFrom);
        }

        if (filters?.dateTo) {
            countQuery += " AND obsDate <= ?";
            dataQuery += " AND obsDate <= ?";
            params.push(filters.dateTo);
        }

        // ✅ NEW: filter by obsHour
        if (filters?.obsHour) {
            countQuery += " AND obsHour = ?";
            dataQuery += " AND obsHour = ?";
            params.push(filters.obsHour);
        }

        // ✅ Updated sortable columns
        const validSortColumns = [
            "obsDate",
            "obsHour",
            "dateSent",
            "status",
            "recip_num",
            "recip_name",
            "stnId",
            "category"
        ];

        if (validSortColumns.includes(sortBy)) {
            dataQuery += ` ORDER BY ${sortBy} ${sortOrder}`;
        } else {
            dataQuery += ` ORDER BY obsDate DESC, obsHour DESC`;
        }

        // Pagination
        if (filters?.limit) {
            dataQuery += " LIMIT ?";
            params.push(filters.limit);
        }

        if (filters?.offset) {
            dataQuery += " OFFSET ?";
            params.push(filters.offset);
        }

        // separate params for count
        const countParams = params.slice(
            0,
            params.length -
            (filters?.limit ? 1 : 0) -
            (filters?.offset ? 1 : 0)
        );

        const totalResult = await db.getFirstAsync<{ total: number }>(
            countQuery,
            countParams
        );

        const total = totalResult?.total || 0;

        const data = await db.getAllAsync(dataQuery, params);

        return { data, total };
    } catch (error) {
        console.error("Error fetching SMS logs:", error);
        return { data: [], total: 0 };
    }
};
// Insert SMS Log
export const insertLSmsLog = async (
    db: SQLite.SQLiteDatabase,
    smsLog: {
        stnId: number;
        uId?: number;
        category: string;
        status: string;
        msg: string;
        recip_num: string;
        recip_name?: string;

        obsDate: string;
        obsHour: string;

        channel?: string;
    }
): Promise<number> => {
    try {
        const result = await db.runAsync(
            `
            INSERT INTO sms_logs (
                stnId,
                uId,
                category,
                status,
                msg,
                recip_num,
                recip_name,
                obsDate,
                obsHour,
                channel
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                smsLog.stnId,
                smsLog.uId || null,
                smsLog.category,
                smsLog.status,
                smsLog.msg,
                smsLog.recip_num,
                smsLog.recip_name || null,
                smsLog.obsDate,
                smsLog.obsHour,
                smsLog.channel || 'skyobs'
            ]
        );

        return result.lastInsertRowId;
    } catch (error) {
        console.error("Error inserting SMS log:", error);
        throw error;
    }
};

// Check if SMS already exists
export const checkSmsExists = async (
    db: SQLite.SQLiteDatabase,
    msg: string,
    recip_num: string,
    category: string
): Promise<boolean> => {
    try {
        const result = await db.getFirstAsync<{ count: number }>(
            `
            SELECT COUNT(*) as count
            FROM sms_logs
            WHERE msg = ?
              AND recip_num = ?
              AND category = ?
              AND status = 'success'
            `,
            [msg, recip_num, category]
        );

        return (result?.count ?? 0) > 0;
    } catch (error) {
        console.error("Error checking SMS existence:", error);
        return false;
    }
};

// Test SMS logs table
export const testSmsLogsTable = async (db: SQLite.SQLiteDatabase) => {
    try {
        console.log("Testing SMS logs table...");

        // Check if table exists
        const tables = await db.getAllAsync(
            `SELECT name FROM sqlite_master WHERE type='table' AND name='sms_logs';`
        );
        console.log("SMS logs table exists:", tables.length > 0);

        if (tables.length > 0) {
            // Get all SMS logs
            const logs = await db.getAllAsync("SELECT * FROM sms_logs");
            console.log("SMS logs count:", logs.length);
            console.log("SMS logs data:", logs);
        }
    } catch (error) {
        console.error("Error testing SMS logs table:", error);
    }
};

// Check if SMS was sent for a specific category on a record
export const checkSmsSentForCategory = async (
    db: SQLite.SQLiteDatabase,
    category: string
): Promise<boolean> => {
    try {
        const result = await db.getFirstAsync(
            `
            SELECT 1 
            FROM sms_logs 
            WHERE category = ? 
              AND status = 'success'
            LIMIT 1
            `,
            [category]
        );

        return !!result;
    } catch (error) {
        console.error("Error checking SMS sent for category:", error);
        return false;
    }
};

// User functions
export const getCurrentUser = async (
    db: SQLite.SQLiteDatabase
) => {
    try {
        const result = await db.getFirstAsync<any>(`
            SELECT 
                uc.*,
                uc.user_id as id, -- ✅ map to frontend user.id
                s.stnName AS station_name,
                s.stationID AS station_code,
                s.Province AS station_province,
                s.Town AS station_town
            FROM user_config uc
            LEFT JOIN stations s 
                ON uc.station_id = s.Id
            WHERE uc.id = 1
            LIMIT 1
            `);
        if (!result) return null;

        return result;
    } catch (error) {
        console.error("Error getting current user:", error);
        return null;
    }
};
export const setCurrentUser = async (
    db: SQLite.SQLiteDatabase,
    userData: any
) => {
    try {
        await db.runAsync(`
        INSERT OR REPLACE INTO user_config (
            id,
            user_id,
            username,
            fullName,
            userType,
            status,
            station_id,
            auth_token,
            createdAt,
            updatedAt
        )
        VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            userData.id,  // backend ID
            userData.username,
            userData.fullName ?? null,
            userData.userType ?? 'USER',
            userData.status ?? 'ACTIVE',
            userData.station_id ?? null,
            userData.auth_token,
            userData.createdAt ?? new Date().toISOString(),
            userData.updatedAt ?? new Date().toISOString()
        ]);

    } catch (error) {
        console.error("Error setting user config:", error);
    }
};

export const createTUserConfig = async (db: SQLite.SQLiteDatabase) => {
    try {
        await db.execAsync(`
        CREATE TABLE IF NOT EXISTS user_config (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            user_id INTEGER,
            username TEXT NOT NULL,
            fullName TEXT,
            userType TEXT DEFAULT 'USER',
            status TEXT DEFAULT 'ACTIVE',
            station_id INTEGER,
            auth_token TEXT NOT NULL,
            createdAt TEXT DEFAULT (datetime('now')),
            updatedAt TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (station_id) REFERENCES stations(id)
        );
        `);

        console.log("user_config table created successfully.");
    } catch (error) {
        console.error("Error creating user_config table:", error);
    }
};

export const clearCurrentUser = async (
    db: SQLite.SQLiteDatabase
) => {
    try {
        await db.runAsync("DELETE FROM user_config WHERE id = 1");
        console.log("User cleared successfully");
    } catch (error) {
        console.error("Error clearing current user:", error);
    }
};

export const upsertSmsRecipient = async (
    db: SQLite.SQLiteDatabase,
    data: {
        recipId?: number;
        stnId: number;
        cID: number;
        num: string;
        name?: string;
    }
) => {
    try {
        if (data.recipId) {
            await db.runAsync(
                `
                UPDATE sms_recipients
                SET
                    cID = ?,
                    num = ?,
                    name = ?,
                    date_updated = datetime('now')
                WHERE recipId = ?
                `,
                [data.cID, data.num, data.name ?? null, data.recipId]
            );
        } else {
            await db.runAsync(
                `
                INSERT INTO sms_recipients (
                    stnId,
                    cID,
                    num,
                    name
                )
                VALUES (?, ?, ?, ?)
                `,
                [data.stnId, data.cID, data.num, data.name ?? null]
            );
        }
    } catch (error) {
        console.error("Error upserting SMS recipient:", error);
    }
};


export const deleteSmsRecipient = async (
    db: SQLite.SQLiteDatabase,
    recipId: number
) => {
    try {
        await db.runAsync(
            `DELETE FROM sms_recipients WHERE recipId = ?`,
            [recipId]
        );
    } catch (error) {
        console.error("Error deleting SMS recipient:", error);
    }
};