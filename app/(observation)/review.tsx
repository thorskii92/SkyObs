import DataCollectionForm from "@/src/components/DataCollectionForm";
import GlobalLoading from "@/src/components/GlobalLoading";
import { getDB, getLSynopData } from "@/src/utils/db";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ReviewObservationScreen() {
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const params = useLocalSearchParams();

    const stationId = Array.isArray(params.stationId) ? params.stationId[0] : params.stationId ?? "";
    const stationName = Array.isArray(params.stationName) ? params.stationName[0] : params.stationName ?? "";
    const mslCor = Array.isArray(params.mslCor) ? params.mslCor[0] : params.mslCor ?? "";
    const altCor = Array.isArray(params.altCor) ? params.altCor[0] : params.altCor ?? "";
    const date = Array.isArray(params.date) ? params.date[0] : params.date ?? "";
    const time = Array.isArray(params.time) ? params.time[0] : params.time ?? "";
    const status = Array.isArray(params.status) ? params.status[0] : params.status ?? "view";

    const dataParams = { stationId, stationName, mslCor, altCor, date, time, status };

    const defaultFormData = {
        visibility: { heightLL: "", VV: "", SummTotal: "" },
        wind: { wDir: "", wSpd: "" },
        temperature: { dBulb: "", wBulb: "", dPoiint: "", RH: "", vaporP: "", maxTemp: "", minTemp: "" },
        pressure: { stnP: "", mslP: "", altP: "", tendency: "", net3hr: "", pres24: "", pAttachTherm: "", pObsBaro: "", pCorrection: "", pBarograph: "", pBaroCorrection: "" },
        clouds: { amtLC: "", firstLayer: { amt: "", type: "", height: "" }, secondLayer: { amt: "", type: "", height: "" }, thirdLayer: { amt: "", type: "", height: "" }, fourthLayer: { amt: "", type: "", height: "" }, ceiling: "", dirLow: "", dirMid: "", dirHigh: "" },
        atmosphericPhenomena: { RR: "", tR: "", presW: "", pastW: "" },
        observer: { remark: "", obsINT: "" }
    };

    const [formData, setFormData] = useState(defaultFormData);

    const setField = (path: string[], value: string) => {
        setFormData((prev) => {
            const updated = { ...prev };
            let current: any = updated;
            for (let i = 0; i < path.length - 1; i++) {
                current[path[i]] = { ...current[path[i]] };
                current = current[path[i]];
            }
            current[path[path.length - 1]] = value;
            return updated;
        });
    };

    const [errors, setErrors] = useState(defaultFormData); // same structure as formData
    const setError = (path: string[], value: string) => {
        setErrors((prev) => {
            const updated = { ...prev };
            let current: any = updated;
            for (let i = 0; i < path.length - 1; i++) {
                current[path[i]] = { ...current[path[i]] };
                current = current[path[i]];
            }
            current[path[path.length - 1]] = value;
            return updated;
        });
    };

    // ----- Load and prefill data -----
    useEffect(() => {
        const loadObservation = async () => {
            try {
                const db = await getDB();
                const results: any[] = await getLSynopData(db, stationId, time, date);

                if (results.length > 0) {
                    const row = results[0];

                    setFormData({
                        visibility: {
                            heightLL: row.heightLL?.toString() ?? "",
                            VV: row.VV?.toString() ?? "",
                            SummTotal: row.SummTotal?.toString() ?? "",
                        },
                        wind: {
                            wDir: row.wDir?.toString() ?? "",
                            wSpd: row.wSpd?.toString() ?? "",
                        },
                        temperature: {
                            dBulb: row.dBulb?.toString() ?? "",
                            wBulb: row.wBulb?.toString() ?? "",
                            dPoiint: row.dPoiint?.toString() ?? "",
                            RH: row.RH?.toString() ?? "",
                            vaporP: row.vaporP?.toString() ?? "",
                            maxTemp: row.maxTemp?.toString() ?? "",
                            minTemp: row.minTemp?.toString() ?? "",
                        },
                        pressure: {
                            stnP: row.stnP?.toString() ?? "",
                            mslP: row.mslP?.toString() ?? "",
                            altP: row.altP?.toString() ?? "",
                            tendency: row.tendency?.toString() ?? "",
                            net3hr: row.net3hr?.toString() ?? "",
                            pres24: row.pres24?.toString() ?? "",
                            pAttachTherm: row.pAttachTherm?.toString() ?? "",
                            pObsBaro: row.pObsBaro?.toString() ?? "",
                            pCorrection: row.pCorrection?.toString() ?? "",
                            pBarograph: row.pBarograph?.toString() ?? "",
                            pBaroCorrection: row.pBaroCorrection?.toString() ?? "",
                        },
                        clouds: {
                            amtLC: row.amtLC?.toString() ?? "",
                            firstLayer: { amt: row.amtFirstLayer?.toString() ?? "", type: row.typeFirstLayer?.toString() ?? "", height: row.heightFirstLayer?.toString() ?? "" },
                            secondLayer: { amt: row.amtSecondLayer?.toString() ?? "", type: row.typeSecondLayer?.toString() ?? "", height: row.heightSecondLayer?.toString() ?? "" },
                            thirdLayer: { amt: row.amtThirdLayer?.toString() ?? "", type: row.typeThirdLayer?.toString() ?? "", height: row.heightThirdLayer?.toString() ?? "" },
                            fourthLayer: { amt: row.amtFourthLayer?.toString() ?? "", type: row.typeFourthLayer?.toString() ?? "", height: row.heightFourthLayer?.toString() ?? "" },
                            ceiling: row.ceiling?.toString() ?? "",
                            dirLow: row.dirLow ?? "",
                            dirMid: row.dirMid ?? "",
                            dirHigh: row.dirHigh ?? "",
                        },
                        atmosphericPhenomena: {
                            RR: row.RR?.toString() ?? "",
                            tR: row.tR?.toString() ?? "",
                            presW: row.presW?.toString() ?? "",
                            pastW: row.pastW1?.toString() ?? "",
                        },
                        observer: {
                            remark: row.remark ?? "",
                            obsINT: row.obsINT ?? "",
                        }
                    });
                }
            } catch (error) {
                console.error("Error loading observation:", error);
            }

            setIsLoading(false);
        };

        loadObservation();
    }, []);

    if (isLoading) return <GlobalLoading />;

    return (
        <SafeAreaView className="flex-1" edges={{ bottom: "additive" }}>
            <DataCollectionForm
                dataParams={dataParams}
                formData={formData}
                setField={setField}
                errors={errors}
                setError={setError}
            />
        </SafeAreaView>
    );
}