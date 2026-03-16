import psychrometricJSON from "@/assets/seeds/psychrometric.json";
import stationsJSON from "@/assets/seeds/stations.json";
import synopDataJSON from "@/assets/seeds/synop_data.json";
import * as SQLite from "expo-sqlite";
import { Station } from "../models/station";

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
                hour TEXT NOT NULL, -- if specific
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
                FOREIGN KEY (cID) REFERENCES category(cID)
            );
        `);

        await db.execAsync(`PRAGMA foreign_keys = ON;`);

        console.log("sms_recipients table created successfully.");
    } catch (error) {
        console.error("Error creating sms_recipients table:", error);
    }
};

// TODO: add category column
export const createTSmsLogs = async (db: SQLite.SQLiteDatabase) => {
    try {
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS sms_logs (
                smsId INTEGER PRIMARY KEY AUTOINCREMENT,
                stnId INTEGER,
                uId INTEGER,
                sId INTEGER,                    -- Foreign key to synop_data.sID
                metId INTEGER,                  -- Foreign key to aerodrome.metID
                status TEXT NOT NULL,          -- e.g., "success", "failed", "pending"
                msg TEXT NOT NULL,
                recip TEXT NOT NULL,
                dateSent TEXT DEFAULT (datetime('now')),
                channel TEXT DEFAULT 'skyobs',    

                UNIQUE(recip, dateSent),
                FOREIGN KEY (stnId) REFERENCES stations(Id),
                FOREIGN KEY (sId) REFERENCES synop_data(sID),
                FOREIGN KEY (metId) REFERENCES aerodrome(metID)
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
            query += ` AND sDate = ?`;
            params.push(sDate);
        }

        // Validate column name to prevent SQL injection
        const allowedColumns = ["sDate", "sHour", "dBulb", "wBulb", "RH", "mslP"];
        if (!allowedColumns.includes(sortBy)) sortBy = "sDate";

        query += ` ORDER BY ${sortBy} ${sortOrder}`;

        const synopData = await db.getAllAsync(query, params);
        return synopData;
    } catch (error) {
        console.error("Error fetching local synoptic data:", error);
        return [];
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
                conditions.push("sd.sDate = ?");
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
                aeroConditions.push("a.sDate = ?");
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

// SEEDER
export const seedTPsychrometricIfEmpty = async (
    db: SQLite.SQLiteDatabase
) => {
    try {
        const result = await db.getFirstAsync<{ count: number }>(
            `SELECT COUNT(*) as count FROM psychrometric`
        );

        if (result && result.count > 0) {
            console.log("Psychrometric table already seeded.");
            return;
        }

        console.log("Seeding psychrometric table...");

        await withTransaction(db, async (tx) => {
            for (const item of psychrometricJSON) {
                await tx.runAsync(
                    `
                    INSERT OR IGNORE INTO psychrometric (
                        dBulb,
                        wBulb,
                        dPoint,
                        RH,
                        vPressure
                    )
                    VALUES (?, ?, ?, ?, ?)
                    `,
                    [
                        item.dBulb ?? null,
                        item.wBulb ?? null,
                        item.dPoint ?? null,
                        item.RH ?? null,
                        item.vPressure ?? null,
                    ]
                );
            }
        });

        console.log("Psychrometric table seeded successfully.");
    } catch (error) {
        console.error("Error seeding psychrometric table:", error);
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

export const seedTCodeTemplatesIfEmpty = async (db: SQLite.SQLiteDatabase) => {
    try {
        const synop = await db.getFirstAsync<{ cID: number }>(`
            SELECT cID FROM category
            WHERE cName='SYNOP'
        `);

        if (!synop) {
            console.warn("SYNOP category not found. Skipping template seeding.");
            return;
        }

        console.log("Seeding SYNOP templates (Main / Intermediate / Hourly)...");

        // =========================
        // BASE TEMPLATES
        // =========================

        const MIDNIGHT_TEMPLATE = `
SMPH01 :ICAO: :YY::GG:00
AAXX :YY::GG:1
:WMOSTN: :iR::Ix::H::VV: :N::ddd::fff: 10:TTT: 20:TdTdTd: 3:STNP: 4:PPPP: 5:a::ppp: :RR24: :WEATHER: :CLOUD: 333 :TMIN: :SUNSHINE: 56:dddL::dddM::dddH: :P24: :RR24: :CGROUP: :GROUP555: :MONTHLYRR:= :WEEKLYRR::RMK::INI:
`.trim();

        const MAIN_TEMPLATE = `
SMPH01 :ICAO: :YY::GG:00
AAXX :YY::GG:1
:WMOSTN: :iR::Ix::H::VV: :N::ddd::fff: 10:TTT: 20:TdTdTd: 3:STNP: 4:PPPP: 5:a::ppp: :RRRR: :RAIN: :WEATHER: :CLOUD: 333 :P24: :CGROUP: = :RMK::INI:
`.trim();

        const INTERMEDIATE_TEMPLATE = `
SIPH20 :ICAO: :YY::GG:00
AAXX :YY::GG:1
:WMOSTN: :iR::Ix::H::VV: :N::ddd::fff: 10:TTT: 20:TdTdTd: 3:STNP: 4:PPPP: 5:a::ppp: :RAIN: :WEATHER: :CLOUD: 333 56:dddL::dddM::dddH: :CGROUP: = :RMK::INI:
`.trim();

        const HOURLY_TEMPLATE = `
SNPH20 :ICAO: :YY::GG:00
AAXX :YY::GG:1
:WMOSTN: :iR::Ix::H::VV: :N::ddd::fff: 10:TTT: 20:TdTdTd: 3:STNP: 4:PPPP: 5//// :WEATHER: :CLOUD: 333 56:dddL::dddM::dddH: :CGROUP: = :RMK::INI:
`.trim();

        const mainHours = ["06", "12", "18"];
        const intermediateHours = ["03", "09", "15", "21"];

        const hours = Array.from({ length: 24 }, (_, i) =>
            i.toString().padStart(2, "0")
        );

        await withTransaction(db, async (tx) => {
            for (const hour of hours) {

                let templateToUse = HOURLY_TEMPLATE;

                // Midnight template
                if (hour === "00") {
                    templateToUse = MIDNIGHT_TEMPLATE;
                }
                // Main synoptic hours
                else if (mainHours.includes(hour)) {
                    templateToUse = MAIN_TEMPLATE;
                }
                // Intermediate hours
                else if (intermediateHours.includes(hour)) {
                    templateToUse = INTERMEDIATE_TEMPLATE;
                }

                await tx.execAsync(`
                    INSERT OR REPLACE INTO codetemplate (stnID, cID, hour, Template, tType)
                    VALUES (
                        1,
                        ${synop?.cID},
                        '${hour}',
                        '${templateToUse.replace(/'/g, "''")}',
                        "Specific"
                    );
                `);
            }
        });

        console.log("SYNOP templates seeded successfully.");

        // =========================
        // MorS GENERAL TEMPLATE FOR METAR & SPECI
        // =========================
        const morsCategories = await db.getAllAsync<{ cID: number }>(`
            SELECT cID FROM category
            WHERE cName IN ('METAR', 'SPECI')
        `);

        if (morsCategories?.length) {
            const morsTemplate = `
:MorS: :CCCC: :YY::GGgg:Z :SW: :VVVV: :PRESWX: :CLOUD: :TD: :AP: :SUP: :REMARKS: :OBSSIG: :ATSSIG:
`.trim();

            await withTransaction(db, async (tx) => {
                for (const cat of morsCategories) {
                    // Insert MorS general template unconditionally with OR IGNORE
                    await tx.execAsync(`
                        INSERT OR REPLACE INTO codetemplate (stnID, cID, hour, Template, tType)
                        VALUES (1, ${cat.cID}, '00', '${morsTemplate.replace(/'/g, "''")}', 'General');
                    `);
                }
            });

            console.log("MorS general template seeded for METAR & SPECI.");
        }


    } catch (error) {
        console.error("Error seeding Code templates:", error);
    }
};

export const seedTCodeParametersIfEmpty = async (db: SQLite.SQLiteDatabase) => {
    try {
        const synop = await db.getFirstAsync<{ cID: number }>(`
            SELECT cID FROM category
            WHERE cName='SYNOP'
        `);

        if (!synop) {
            console.warn("SYNOP category not found. Skipping parameter seeding.");
            return;
        }

        // Get METAR and SPECI categories
        const morsCat = await db.getAllAsync<{ cID: number; cName: string }>(`
            SELECT cID, cName FROM category
            WHERE cName IN ('METAR', 'SPECI')
        `);

        if (!morsCat || morsCat.length === 0) {
            console.warn("METAR/SPECI categories not found.");
            return;
        }

        const synopCols = [
            { varname: "Station ID / WMO ID", var: "wmostn", par: ":WMOSTN:" },
            { varname: "ICAO Station ID", var: "ICAO", par: ":ICAO:" },
            { varname: "Date", var: "sDate", par: ":YY:" },
            { varname: "Hour", var: "sHour", par: ":GG:" },
            { varname: "Lower Level Height", var: "heightLL", par: ":H:" },
            { varname: "Visibility", var: "VV", par: ":VV:" },
            { varname: "Summation Total", var: "SummTotal", par: ":N:" },
            { varname: "Wind Indicator", var: "wIndc", par: ":iw:" },
            { varname: "Wind Direction", var: "wDir", par: ":ddd:" },
            { varname: "Wind Speed", var: "wSpd", par: ":fff:" },
            { varname: "Dry Bulb Temperature", var: "dBulb", par: ":TTT:" },
            { varname: "Dew Point", var: "dPoiint", par: ":TdTdTd:" },
            { varname: "Station Pressure", var: "stnP", par: ":STNP:" },
            { varname: "MSL Pressure", var: "mslP", par: ":PPPP:" },
            { varname: "Tendency", var: "tendency", par: ":a:" },
            { varname: "Net 3-Hr Pressure Change", var: "net3hr", par: ":ppp:" },
            { varname: "Amount of Rainfall", var: "RR", par: ":RRRR:" },
            { varname: "Duration of Rainfall", var: "tR", par: ":TR:" },
            { varname: "Rain Indicator", var: "rainIndc", par: ":iR:" },
            { varname: "Indicator of Weather Phenomena", var: "wpIndc", par: ":Ix:" },
            { varname: "Present Weather", var: "presW", par: ":ww:" },
            { varname: "Past Weather 1", var: "pastW1", par: ":W1:" },
            { varname: "Past Weather 2", var: "pastW2", par: ":W2:" },
            { varname: "Total Amount of Low Clouds", var: "amtLC", par: ":Nh:" },
            { varname: "Amount of First Layer", var: "amtFirstLayer", par: ":A1:" },
            { varname: "Type of First Layer", var: "typeFirstLayer", par: ":T1:" },
            { varname: "Height of First Layer", var: "heightFirstLayer", par: ":H1:" },
            { varname: "Amount of Second Layer", var: "amtSecondLayer", par: ":A2:" },
            { varname: "Type of Second Layer", var: "typeSecondLayer", par: ":T2:" },
            { varname: "Height of Second Layer", var: "heightSecondLayer", par: ":H2:" },
            { varname: "Amount of Third Layer", var: "amtThirdLayer", par: ":A3:" },
            { varname: "Type of Third Layer", var: "typeThirdLayer", par: ":T3:" },
            { varname: "Height of Third Layer", var: "heightThirdLayer", par: ":H3:" },
            { varname: "Amount of Fourth Layer", var: "amtFourthLayer", par: ":A4:" },
            { varname: "Type of Fourth Layer", var: "typeFourthLayer", par: ":T4:" },
            { varname: "Height of Fourth Layer", var: "heightFourthLayer", par: ":H4:" },
            { varname: "Ceiling", var: "ceiling", par: ":CEIL:" },
            { varname: "Max Temperature", var: "maxTemp", par: ":Tx:" },
            { varname: "Min Temperature", var: "minTemp", par: ":Tn:" },
            { varname: "24-Hour Pressure Change", var: "pres24", par: ":P24:" },
            { varname: "Remark", var: "remark", par: ":RMK:" },
            { varname: "Observer Initials", var: "obsINT", par: ":INI:" },

            // NEW PARAMETERS for templates
            { varname: "Hourly Rain", var: "rainHourly", par: ":RAIN:" },
            { varname: "Weather Group", var: "weatherGroup", par: ":WEATHER:" },
            { varname: "Cloud Group", var: "cloudGroup", par: ":CLOUD:" },
            { varname: "Cloud Direction Low", var: "dirLow", par: ":dddL:" },
            { varname: "Cloud Direction Mid", var: "dirMid", par: ":dddM:" },
            { varname: "Cloud Direction High", var: "dirHigh", par: ":dddH:" },
            { varname: "Cloud Group Identifier", var: "cGroup", par: ":CGROUP:" },

            { varname: "24 Hour Rainfall Group", var: "RR24", par: ":RR24:" },
            { varname: "Previous Day Minimum Temperature", var: "minTempPrev", par: ":TMIN:" },
            { varname: "Weekly Rainfall Remark", var: "weeklyRRRemark", par: ":WEEKLYRR:" },
            { varname: "Monthly Rainfall Group", var: "monthlyRRGroup", par: ":MONTHLYRR:" },
            { varname: "Group 555 Rain Indicator", var: "group555", par: ":GROUP555:" },
            { varname: "Sunshine Duration", var: "sunshine", par: ":SUNSHINE:" },
        ];

        const morsCols = [
            { varname: "MorS", var: "MorS", par: ":MorS:" },
            { varname: "ICAO", var: "ICAO", par: ":CCCC:" },
            { varname: "Date", var: "sDate", par: ":YY:" },
            { varname: "Hour", var: "sHour", par: ":GGgg:" },
            { varname: "Surface Wind", var: "SurfaceWind", par: ":SW:" },
            { varname: "Pressure VV", var: "PresVV", par: ":VVVV:" },
            { varname: "Pressure Weather", var: "PresWx", par: ":PRESWX:" },
            { varname: "Cloud", var: "cloud", par: ":CLOUD:" },
            { varname: "Temperature & Dewpoint", var: "TD", par: ":TD:" },
            { varname: "Altimeter Pressure", var: "AltPres", par: ":AP:" },
            { varname: "Supplemental", var: "Supplemental", par: ":SUP:" },
            { varname: "Remarks", var: "Remarks", par: ":REMARKS:" },
            { varname: "Observer's", var: "Signature", par: ":OBSSIG:" },
            { varname: "ATS Signature", var: "ATS", par: ":ATSSIG:" },
        ];

        await withTransaction(db, async (tx) => {
            console.log("Seeding codeparameter table...");
            for (const col of synopCols) {
                await tx.runAsync(
                    `INSERT OR REPLACE INTO codeparameter (stnID, cID, varname, var, par)
             VALUES (?, ?, ?, ?, ?)`,
                    [1, synop?.cID, col.varname, col.var, col.par]
                );
            }

            console.log("Seeding codeparameter table for METAR & SPECI...");
            for (const cat of morsCat) {
                for (const col of morsCols) {
                    await tx.runAsync(
                        `INSERT OR REPLACE INTO codeparameter (stnID, cID, varname, var, par)
                 VALUES (?, ?, ?, ?, ?)`,
                        [1, cat.cID, col.varname, col.var, col.par]
                    );
                }
            }
        });
        console.log("Code parameters seeded successfully within a transaction.");
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

        console.log("Seeding category table...");

        const categories = [
            "SYNOP",
            "METAR",
            "SPECI",
            "AGROMET",
        ];

        await withTransaction(db, async (tx) => {
            for (const c of categories) {
                await tx.execAsync(`
                    INSERT OR IGNORE INTO category (stnID, cName)
                    VALUES (1, '${c}')
                `);
            }
        });

        console.log("Categories seeded successfully.");

    } catch (error) {
        console.error("Error seeding categories:", error);
    }
};

export const computeObservedPeriod = async (
    db: SQLite.SQLiteDatabase,
    stnID: number | string,
    sDate: string,
    sHour: string
): Promise<string> => {

    let hoursToCheck: number;
    let resultCode: string;

    // Determine hours to check and result code based on synoptic hour
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
        // Hour not recognized -> return empty string
        return "";
    }

    // Fetch all rows for that station and date
    const rows = await db.getAllAsync(
        `SELECT RR, sHour 
     FROM synop_data
     WHERE stnID = ?
       AND sDate = ?`,
        [stnID, sDate]
    );

    const currentHour = Number(sHour.slice(0, 2));

    // Check if any recorded rainfall is within the period
    const hasRain = rows.some((r: any) => {
        if (!r.RR) return false;

        const rowHour = Number(r.sHour.slice(0, 2));
        const diff = currentHour - rowHour;

        return diff >= 0 && diff <= hoursToCheck;
    });

    return hasRain ? resultCode : "0";
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
        limit?: number;
        offset?: number;
    },
    sortBy: string = "dateSent",
    sortOrder: "ASC" | "DESC" = "DESC"
): Promise<any[]> => {
    try {
        let query = `
            SELECT
                smsId,
                sms_logs.stnId,
                uId,
                sId,
                metId,
                status,
                msg,
                recip,
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
            query += " AND sms_logs.stnId = ?";
            params.push(filters.stnId);
        }

        if (filters?.status) {
            query += " AND status = ?";
            params.push(filters.status);
        }

        if (filters?.recip) {
            query += " AND recip LIKE ?";
            params.push(`%${filters.recip}%`);
        }

        if (filters?.dateFrom) {
            query += " AND date(dateSent) >= date(?)";
            params.push(filters.dateFrom);
        }

        if (filters?.dateTo) {
            query += " AND date(dateSent) <= date(?)";
            params.push(filters.dateTo);
        }

        // Sorting
        const validSortColumns = ["dateSent", "status", "recip", "stnId"];
        if (validSortColumns.includes(sortBy)) {
            query += ` ORDER BY ${sortBy} ${sortOrder}`;
        } else {
            query += ` ORDER BY dateSent ${sortOrder}`;
        }

        // Pagination
        if (filters?.limit) {
            query += " LIMIT ?";
            params.push(filters.limit);
        }

        if (filters?.offset) {
            query += " OFFSET ?";
            params.push(filters.offset);
        }

        const results = await db.getAllAsync(query, params);
        return results;
    } catch (error) {
        console.error("Error fetching SMS logs:", error);
        return [];
    }
};

// Insert SMS Log
export const insertLSmsLog = async (
    db: SQLite.SQLiteDatabase,
    smsLog: {
        stnId: number;
        uId?: number;
        sId?: number;
        metId?: number;
        status: string;
        msg: string;
        recip: string;
        channel?: string;
    }
): Promise<number> => {
    try {
        const result = await db.runAsync(
            `
            INSERT INTO sms_logs (stnId, uId, sId, metId, status, msg, recip, channel)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                smsLog.stnId,
                smsLog.uId || null,
                smsLog.sId || null,
                smsLog.metId || null,
                smsLog.status,
                smsLog.msg,
                smsLog.recip,
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
    recip: string,
    status: string = "success",
    recordId?: number | string | null,
    idType?: 'sId' | 'metId'
): Promise<boolean> => {
    try {
        let query = `
            SELECT COUNT(*) as count
            FROM sms_logs
            WHERE msg = ? AND recip = ? AND status = ?
        `;
        const params: any[] = [msg, recip, status];

        if (recordId && idType) {
            query += ` AND ${idType} = ?`;
            params.push(recordId);
        }

        const result = await db.getFirstAsync<{ count: number }>(query, params);
        return (result?.count || 0) > 0;
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
    recordId: number | string | null,
    idType: 'sId' | 'metId',
    category: string
): Promise<boolean> => {
    if (!recordId) return false;
    try {
        const result = await db.getFirstAsync(
            `SELECT 1 FROM sms_logs WHERE ${idType} = ? AND channel = ? AND status = 'success' LIMIT 1`,
            [recordId, category]
        );
        return !!result;
    } catch (error) {
        console.error("Error checking SMS sent for category:", error);
        return false;
    }
};