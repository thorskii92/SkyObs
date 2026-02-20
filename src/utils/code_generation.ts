import { SQLiteDatabase } from "expo-sqlite";
import { getLCodeParams, getLCodeTemplate } from "./db";

export default async function generateCodeFromTemplate(
    db: SQLiteDatabase,
    stnID: string,
    category: string,
    hour: string,
    obsData: Record<string, string | number>
): Promise<string> {
    try {
        const templateRow = await getLCodeTemplate(db, stnID, category, hour);
        if (!templateRow) return ""

        let code: string = templateRow?.Template;

        const codeParams = await getLCodeParams(db, stnID, category);
        if (!codeParams) return ""

        for (const param of codeParams) {
            const rawValue = obsData[param.varName];
            const value = rawValue !== undefined && rawValue !== null ? String(rawValue) : "";

            code = code.replace(new RegExp(param.par, "g"), value ?? "");
        }

        return code
    } catch (error) {
        console.error("Error generating code:", error);
        return ""
    }
}